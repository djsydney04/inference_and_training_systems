import "./styles.css";
import "./textbook.css";
import "./reader.css";
import "./workbench.css";
import "./kernel.css";
import "./methods.css";
import { atlasMarkup } from "./content";
import { initializeGlossary } from "./glossary";
import { initializeInteractions } from "./interactions";
import { initializeTrainingSystems } from "./training-systems";
import { initializeTextbook } from "./textbook";
import { prepareReader, initializeReader } from "./reader";
import { initializeSystemsLabs } from "./systems-labs";
import { initializeMatmulLab } from "./kernel-lab";
import { initializeMethodLabs } from "./method-labs";
import { initializeDecodingLabs } from "./decoding-labs";
import { initializeHardwareLabs } from "./hardware-labs";
import { initializeParallelLabs } from "./parallel-labs";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) throw new Error("Atlas root element is missing");

app.innerHTML = atlasMarkup;
prepareReader();

initializeGlossary();
initializeInteractions();
initializeTrainingSystems();
initializeTextbook();
initializeSystemsLabs();
initializeMatmulLab();
initializeMethodLabs();
initializeDecodingLabs();
initializeHardwareLabs();
initializeParallelLabs();
initializeReader();

void import("./scenes").then(({ initializeScenes }) => initializeScenes());
