import type { TagsConfig } from "@jakamarinko/api";

// Set by the tags once their config is loaded, read by track(): which events count as Google Ads conversions.
// Its own module so the tags don't pull in track() and the api schemas behind it.
let googleAds: TagsConfig["googleAds"] = null;
export const setGoogleAds = (config: TagsConfig["googleAds"]) => (googleAds = config);
export const getGoogleAds = () => googleAds;
