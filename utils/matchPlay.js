import { extractItemData, mapMatchDetail } from "../api/mappers";
import { fetchMatchById } from "../api/contentService";
import { getErrorMessage } from "../api/client";
import { mapMatchLinksToServers } from "./football";
import {
  noStreamBlock,
  parsePlaybackBlock,
  subscriptionRequiredBlock,
} from "./playback";

function pickPlayServer(match, preferredServerId) {
  const servers = mapMatchLinksToServers(match?.links ?? []);
  const playable = servers.filter((server) => Boolean(server.url));

  if (preferredServerId) {
    const preferred = playable.find((server) => server.id === String(preferredServerId));
    if (preferred) {
      return { match, server: preferred, servers };
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

  let resolved = pickPlayServer(detail, server?.id);
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
    resolved = pickPlayServer(detail, server?.id);

    if (resolved.server?.url) {
      console.log("[Player] resolved match playback URL", {
        matchId,
        serverId: resolved.server.id,
        streamUrl: resolved.server.url,
      });
      return { ...resolved, blocked: null };
    }

    console.warn("[Player] GET /matches/{id} returned no playable links", { matchId });
    return {
      ...resolved,
      blocked: subscriptionRequiredBlock(),
    };
  } catch (error) {
    console.warn("[Player] GET /matches/{id} failed", {
      matchId,
      status: error?.response?.status ?? null,
      message: getErrorMessage(error),
    });

    return {
      ...pickPlayServer(detail, server?.id),
      blocked: parsePlaybackBlock(error) ?? subscriptionRequiredBlock(),
    };
  }
}
