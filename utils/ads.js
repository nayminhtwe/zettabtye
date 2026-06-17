export function isSubscriptionActive(user) {
  const endDate = user?.subscription_end_date;
  if (!endDate) {
    return false;
  }

  const expiresAt = new Date(endDate).getTime();
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}
