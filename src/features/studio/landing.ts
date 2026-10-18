/**
 * Entry point for the public chat-generator pages. Kept apart from `index.ts`
 * so importing it never pulls the client studio bundle into those routes.
 */
export { ChatGeneratorPage } from "./components/landing/ChatGeneratorPage";
export { ChatGeneratorsHub } from "./components/landing/ChatGeneratorsHub";
export {
  APP_NAMES,
  isLandingApp,
  LANDING_APPS,
  landingPath,
  screenshotSrc,
  type LandingApp,
} from "./components/landing/landing-data";
