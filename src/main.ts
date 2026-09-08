import "./styles.css";
import "./textbook.css";
import { atlasMarkup } from "./content";
import { initializeGlossary } from "./glossary";
import { initializeInteractions } from "./interactions";
import { initializeTrainingSystems } from "./training-systems";
import { initializeTextbook } from "./textbook";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) throw new Error("Atlas root element is missing");

app.innerHTML = atlasMarkup;

initializeGlossary();
initializeInteractions();
initializeTrainingSystems();
initializeTextbook();

void import("./scenes").then(({ initializeScenes }) => initializeScenes());
