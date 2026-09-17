import { machinePlate } from "./machine-plate";
import { release, releaseNotesMarkup } from "./release";
import { studyImage } from "./book-illustrations";

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
  <section class="landing-preface" aria-labelledby="landing-inside-title">
    <h2 id="landing-inside-title">A closer look at<br>artificial intelligence.</h2>
    <p>From the first token to the last transistor. An illustrated guide to the ideas, the machinery, and everything that connects them.</p>
  </section>
  <section class="landing-study landing-study-model" aria-labelledby="study-model-title">
    <figure class="landing-artwork">
      ${studyImage("model")}
      <figcaption><span>Tokens, attention, prediction</span><span>A conceptual study</span></figcaption>
    </figure>
    <div class="landing-study-copy">
      <p class="study-subject">The models</p>
      <h2 id="study-model-title">A prediction,<br>taken apart.</h2>
      <p>See how numbers become a prediction. Follow attention, trace a gradient, and change the weights yourself.</p>
      <a href="#first-principles">Explore the foundations <span aria-hidden="true">↗</span></a>
      <div class="study-topics">Tensors <span>/</span> Attention <span>/</span> Training</div>
    </div>
  </section>
  <section class="landing-study landing-study-silicon" aria-labelledby="study-silicon-title">
    <div class="landing-study-copy">
      <p class="study-subject">The machines</p>
      <h2 id="study-silicon-title">The physical side<br>of intelligence.</h2>
      <p>Every calculation needs a place to happen. Look inside the chip, follow a memory access, and find what makes a processor wait.</p>
      <a href="#machine">Look inside the hardware <span aria-hidden="true">↗</span></a>
      <div class="study-topics">Logic <span>/</span> Memory <span>/</span> Compute</div>
    </div>
    <figure class="landing-artwork">
      ${studyImage("silicon")}
      <figcaption><span>Compute, memory, interconnect</span><span>Conceptual, not a die floorplan</span></figcaption>
    </figure>
  </section>
  <section class="landing-study landing-study-systems" aria-labelledby="study-systems-title">
    <figure class="landing-artwork">
      ${studyImage("systems")}
      <figcaption><span>Connected machines, shared work</span><span>A conceptual network</span></figcaption>
    </figure>
    <div class="landing-study-copy">
      <p class="study-subject">The systems</p>
      <h2 id="study-systems-title">One model.<br>Many moving parts.</h2>
      <p>Connect the machines. Divide the work. Follow a training step across devices and a request through a running model.</p>
      <a href="#training">Follow the system <span aria-hidden="true">↗</span></a>
      <div class="study-topics">Parallelism <span>/</span> Networks <span>/</span> Inference</div>
    </div>
  </section>
  <section class="landing-begin" aria-labelledby="landing-begin-title">
    <div><p>Read. Inspect. Experiment.</p><h2 id="landing-begin-title">Start with a question.<br>Follow it all the way down.</h2></div>
    <div><a class="landing-enter" href="#top">Start reading <span aria-hidden="true">→</span></a><a class="landing-browse" href="#gallery">Or browse the diagrams</a></div>
  </section>
  ${releaseNotesMarkup}
</section>`;
