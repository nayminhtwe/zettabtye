import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import ViberIcon from "../assets/images/help/basil_viber-outline.svg";
import PremiumMembershipCard from "../components/PremiumMembershipCard";
import { gillSans } from "../constants/fonts";
import { useScreenInsets } from "../hooks/useScreenInsets";
import { fetchGenresRequest } from "../store/catalog/actions";
import { selectGenres, selectGenresLoading } from "../store/catalog/selectors";
import { selectSupportContacts } from "../store/ads/selectors";

const CONTENT_PADDING = 16;

const STATIC_FAQ_ITEMS = [
  {
    id: "free",
    question: "Is this app free?",
    answer:
      "Yes! You can watch movies for free with ads. We also offer a premium plan for ad-free streaming and extra perks.",
  },
  {
    id: "devices",
    question: "Which devices are supported?",
    answer:
      "Zettabyte works on Android phones, Android TV, and supported streaming devices. More platforms are coming soon.",
  },
  {
    id: "cancel",
    question: "How do I cancel my subscription?",
    answer:
      "Open your profile, go to subscription settings, and choose Cancel plan. Your premium access stays active until the billing period ends.",
  },
];

const CONTACT_UI = {
  viber: {
    renderIcon: () => <ViberIcon width={18} height={18} />,
    iconBackgroundColor: "#7360F2",
    actionIcon: "open-outline",
  },
  facebook: {
    icon: "logo-facebook",
    iconBackgroundColor: "#0084FF",
    actionIcon: "open-outline",
  },
  telegram: {
    icon: "paper-plane",
    iconBackgroundColor: "#229ED9",
    actionIcon: "open-outline",
  },
  messenger: {
    icon: "chatbubble-ellipses",
    iconBackgroundColor: "#0084FF",
    actionIcon: "open-outline",
  },
  website: {
    icon: "globe-outline",
    iconBackgroundColor: "#E71809",
    actionIcon: "open-outline",
  },
};

function buildGenreFaqItem(genres) {
  const genreNames = genres.map((genre) => genre.name).filter(Boolean);
  const answer =
    genreNames.length > 0
      ? `We offer movies and series across ${genreNames.join(", ")}.`
      : "Browse the Categories tab to see available genres.";

  return {
    id: "genres",
    question: "What genres are available?",
    answer,
  };
}

function openContactAction(action) {
  if (!action) {
    return;
  }

  Linking.openURL(action).catch(() => {});
}

function FaqItem({ item, expanded, onToggle }) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      style={[styles.faqCard, focused ? styles.faqCardFocused : null]}
      onPress={onToggle}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <View style={styles.faqToggle}>
          <Ionicons name={expanded ? "remove" : "add"} size={20} color="#E71809" />
        </View>
      </View>
      {expanded ? <Text style={styles.faqAnswer}>{item.answer}</Text> : null}
    </Pressable>
  );
}

function HelpContactRow({
  icon,
  iconElement,
  iconBackgroundColor,
  label,
  actionIcon,
  showAction = true,
  onActionPress,
}) {
  const [actionFocused, setActionFocused] = useState(false);

  return (
    <View style={styles.contactRow}>
      <View style={[styles.contactIconWrap, { backgroundColor: iconBackgroundColor }]}>
        {iconElement ?? <Ionicons name={icon} size={18} color="#FFFFFF" />}
      </View>
      <Text style={styles.contactLabel} numberOfLines={1}>
        {label}
      </Text>
      {showAction ? (
        <Pressable
          onPress={onActionPress}
          onFocus={() => setActionFocused(true)}
          onBlur={() => setActionFocused(false)}
          style={[styles.contactActionButton, actionFocused ? styles.contactActionButtonFocused : null]}
        >
          <Ionicons name={actionIcon} size={18} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function GetHelpScreen({ onBack, onSearchPress }) {
  const dispatch = useDispatch();
  const { contentBottomPadding } = useScreenInsets(32);
  const genres = useSelector(selectGenres);
  const genresLoading = useSelector(selectGenresLoading);
  const supportContacts = useSelector(selectSupportContacts);
  const [backFocused, setBackFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [expandedFaqId, setExpandedFaqId] = useState(STATIC_FAQ_ITEMS[0].id);

  const faqItems = useMemo(
    () => [...STATIC_FAQ_ITEMS, buildGenreFaqItem(genres)],
    [genres],
  );

  useEffect(() => {
    if (!genres.length && !genresLoading) {
      dispatch(fetchGenresRequest());
    }
  }, [dispatch, genres.length, genresLoading]);

  const toggleFaq = (faqId) => {
    setExpandedFaqId((current) => (current === faqId ? null : faqId));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable
          style={[styles.headerIconButton, backFocused ? styles.headerIconButtonFocused : null]}
          onPress={onBack}
          onFocus={() => setBackFocused(true)}
          onBlur={() => setBackFocused(false)}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Get Help
        </Text>

        <Pressable
          style={[styles.headerIconButton, searchFocused ? styles.headerIconButtonFocused : null]}
          onPress={onSearchPress}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        >
          <Ionicons name="search" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>About Us</Text>

        <View style={styles.contactList}>
          {supportContacts.map((contact, index) => {
            const ui = CONTACT_UI[contact.id] ?? CONTACT_UI.website;

            return (
              <React.Fragment key={contact.id}>
                {index > 0 ? <View style={styles.contactDivider} /> : null}
                <HelpContactRow
                  icon={ui.icon}
                  iconElement={ui.renderIcon?.()}
                  iconBackgroundColor={ui.iconBackgroundColor}
                  label={contact.label}
                  actionIcon={ui.actionIcon}
                  showAction={Boolean(contact.action)}
                  onActionPress={() => openContactAction(contact.action)}
                />
              </React.Fragment>
            );
          })}
        </View>

        <PremiumMembershipCard variant="compact" style={styles.proCard} />

        <Text style={styles.faqSectionTitle}>FAQs and Support</Text>
        <View style={styles.faqList}>
          {faqItems.map((item) => (
            <FaqItem
              key={item.id}
              item={item}
              expanded={expandedFaqId === item.id}
              onToggle={() => toggleFaq(item.id)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingRight: 16,
    paddingBottom: 8,
    paddingLeft: 16,
    backgroundColor: "#1D1B20",
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconButtonFocused: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  headerTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 30,
    textAlign: "center",
    marginHorizontal: 8,
    ...gillSans("600"),
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: 16,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    ...gillSans("600"),
  },
  contactList: {
    borderRadius: 12,
    backgroundColor: "#1D1B20",
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    gap: 12,
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    ...gillSans("400"),
  },
  contactActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  contactActionButtonFocused: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  contactDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  proCard: {
    marginTop: 0,
    marginBottom: 24,
  },
  faqSectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    ...gillSans("600"),
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    borderRadius: 10,
    backgroundColor: "#D9D9D9",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  faqCardFocused: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    color: "#000000",
    fontSize: 15,
    lineHeight: 22,
    ...gillSans("700"),
  },
  faqToggle: {
    width: 24,
    height: 24,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E71809",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  faqAnswer: {
    marginTop: 8,
    color: "#000000",
    fontSize: 14,
    lineHeight: 22,
    ...gillSans("400"),
  },
});
