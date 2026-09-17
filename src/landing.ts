import { machinePlate } from "./machine-plate";
import { release, releaseNotesMarkup } from "./release";

export const landingMarkup = `
<section class="atlas-landing" id="welcome" aria-labelledby="landing-title">
  <div class="landing-cover">
    <p class="landing-identity"><span>An independent field guide</span><span>Edition ${release.date.slice(0,7).replace("-", ".")} / ${release.version}</span></p>
    <h1 id="landing-title">AI <span>Almanac</span></h1>
    <div class="landing-introduction">
      <p>Explore the models, code, and machines behind artificial intelligence.</p>
      <a class="landing-enter" href="#top">Open the almanac <span aria-hidden="true">→</span></a>
      <span class="landing-entry-note">Start with the foundations. Explore at your own pace.</span>
    </div>
    <div class="landing-machine">${machinePlate("landing-plate")}</div>
    <div class="landing-caption"><span>From first principles to full systems</span><a href="#gallery">Explore the diagrams <span aria-hidden="true">↗</span></a></div>
  </div>
  <section class="landing-inside" aria-labelledby="landing-inside-title">
    <div><p class="landing-label">Inside the almanac</p><h2 id="landing-inside-title">Follow the work.<br>From numbers to silicon.</h2><p>Read a concept, open the machine, and change an input. The diagrams and labs connect each idea to the system around it.</p><a href="#top">View the course guide <span aria-hidden="true">→</span></a></div>
    <ol class="landing-sequence">
      <li><span>01</span><div><h3>Build the foundations</h3><p>Follow a prediction, calculate a gradient, and watch a model learn.</p></div></li>
      <li><span>02</span><div><h3>Look inside the hardware</h3><p>Inspect compute, memory, and communication from a circuit to a cluster.</p></div></li>
      <li><span>03</span><div><h3>Run the whole system</h3><p>Write kernels, distribute training, and trace a request through inference.</p></div></li>
    </ol>
  </section>
  ${releaseNotesMarkup}
</section>`;
