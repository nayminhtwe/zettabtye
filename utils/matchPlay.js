import { extractItemData, mapMatchDetail } from "../api/mappers";
import { fetchMatchById } from "../api/contentService";
import { mapMatchLinksToServers } from "./football";
import {
  noStreamBlock,
  parsePlaybackBlock,
  subscriptionRequiredBlock,
} from "./playback";

function pickPlayServer(match, preferredServer = null) {
  const servers = mapMatchLinksToServers(match?.links ?? []);
  const playable = servers.filter((server) => Boolean(server.url));
  const preferredId = preferredServer?.id != null ? String(preferredServer.id) : null;

  if (preferredId) {
    const preferredWithUrl = playable.find((server) => server.id === preferredId);
    if (preferredWithUrl) {
      return { match, server: preferredWithUrl, servers };
    }

    const preferredEntry = servers.find((server) => server.id === preferredId);
    if (preferredEntry) {
      return { match, server: preferredEntry, servers };
    }
  }

  return { match, server: playable[0] ?? null, servers };
}

/**
 * Match list endpoints omit stream URLs — only GET /matches/{id} includes them
 * (auth + active subscription).
 */
export async function resolveMatchPlay(match = {}, server = null, cachedDetail = null) {
  const matchId = match?.id ?? match?.apiId;
  let detail = cachedDetail ?? match;

  let resolved = pickPlayServer(detail, server);
  if (resolved.server?.url) {
    return { ...resolved, blocked: null };
  }

  if (!matchId) {
    return {
      ...resolved,
      blocked: noStreamBlock(),
    };
  }

  try {
    const response = await fetchMatchById(matchId);
    detail = mapMatchDetail(extractItemData(response));
    resolved = pickPlayServer(detail, server);

    if (resolved.server?.url) {
      return { ...resolved, blocked: null };
    }

    return {
      ...resolved,
      blocked: subscriptionRequiredBlock(),
    };
  } catch (error) {
    return {
      ...pickPlayServer(detail, server),
      blocked: parsePlaybackBlock(error) ?? subscriptionRequiredBlock(),
    };
  }
}
