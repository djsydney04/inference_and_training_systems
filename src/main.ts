import "./styles.css";
import "./textbook.css";
import "./reader.css";
import "./workbench.css";
import { atlasMarkup } from "./content";
import { initializeGlossary } from "./glossary";
import { initializeInteractions } from "./interactions";
import { initializeTrainingSystems } from "./training-systems";
import { initializeTextbook } from "./textbook";
import { prepareReader, initializeReader } from "./reader";
import { initializeSystemsLabs } from "./systems-labs";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) throw new Error("Atlas root element is missing");

app.innerHTML = atlasMarkup;
prepareReader();

initializeGlossary();
initializeInteractions();
initializeTrainingSystems();
initializeTextbook();
initializeSystemsLabs();
initializeReader();

void import("./scenes").then(({ initializeScenes }) => initializeScenes());
