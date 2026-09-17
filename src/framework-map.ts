export type FrameworkRoute = {
  id: string;
  title: string;
  layers: { role: string; tool: string; responsibility: string }[];
  firstProof: string;
};

// Deliberately concrete example configurations, not compatibility recommendations.
export const frameworkRoutes: FrameworkRoute[] = [
  { id: "custom", title: "Write a model in PyTorch", layers: [
    { role: "Model", tool: "Your nn.Module", responsibility: "Define the forward computation and registered parameters." },
    { role: "Update", tool: "Your loop + torch.optim", responsibility: "Choose the loss, accumulate gradients and update state." },
    { role: "Execution", tool: "PyTorch eager; optionally torch.compile", responsibility: "Dispatch tensor operations; optionally capture and compile regions." },
    { role: "Device", tool: "CPU backend in the first exercise", responsibility: "Execute kernels using the available instruction set and memory." },
  ], firstProof: "Match the loss, every gradient and one complete optimizer update with a small reference." },
  { id: "jax", title: "Transform a program in JAX", layers: [
    { role: "Model", tool: "An array function; optionally Flax", responsibility: "Make parameters, inputs and changing state explicit." },
    { role: "Update", tool: "jax.value_and_grad; optionally Optax", responsibility: "Differentiate a scalar objective and return updated state." },
    { role: "Execution", tool: "jax.jit → XLA", responsibility: "Stage a supported computation and compile for its shapes, types and backend." },
    { role: "Device", tool: "CPU in the reference exercise", responsibility: "Execute the lowered program; wait for completion before measuring it." },
  ], firstProof: "Compare eager and compiled results, including explicit state passed into the next call." },
  { id: "keras", title: "Train with Keras and TensorFlow", layers: [
    { role: "Model", tool: "Keras layers and Model", responsibility: "Describe trainable layers and their variables." },
    { role: "Update", tool: "Model.fit or a custom GradientTape loop", responsibility: "Apply the declared loss, metrics and optimizer semantics." },
    { role: "Execution", tool: "TensorFlow eager / tf.function", responsibility: "Run operations eagerly or trace callable graphs; XLA is a separate compilation choice." },
    { role: "Device", tool: "CPU in the reference exercise", responsibility: "Execute registered kernels for the selected operations." },
  ], firstProof: "Verify loss reduction and variable updates. This route selects TensorFlow; Keras 3 also supports JAX and PyTorch backends." },
  { id: "adapter", title: "Fine-tune a supported checkpoint", layers: [
    { role: "Model and text", tool: "Transformers + tokenizer", responsibility: "Load the architecture, weights, token IDs and chat serialization." },
    { role: "Trainable state", tool: "PEFT adapters", responsibility: "Select the parameter subset and adapter forward path." },
    { role: "Training loop", tool: "TRL or Trainer; optionally Accelerate", responsibility: "Construct the objective and coordinate a selected distributed backend." },
    { role: "Execution", tool: "PyTorch + the selected device backend", responsibility: "Differentiate operations and execute local tensor work." },
  ], firstProof: "Print a token/label trace, confirm trainable parameters, and reload the adapter with its exact base revision." },
  { id: "server", title: "Serve a supported model with vLLM", layers: [
    { role: "Request", tool: "Client + chat template", responsibility: "Define input tokens, sampling options, stop rules and completion semantics." },
    { role: "Service engine", tool: "vLLM", responsibility: "Manage active requests, cache allocation and model execution." },
    { role: "Model execution", tool: "Supported model implementation + selected kernels", responsibility: "Read the weights, compute logits and preserve compatible KV state." },
    { role: "Device", tool: "Compatible accelerator / runtime combination", responsibility: "Run the engine's supported dtype, layout and operator paths." },
  ], firstProof: "Match rendered token IDs and logits on a fixed prefix before measuring request goodput." },
  { id: "local", title: "Run a converted model locally", layers: [
    { role: "Artifact", tool: "Supported GGUF model", responsibility: "Carry tensor data and metadata expected by this loader." },
    { role: "Generation", tool: "llama.cpp", responsibility: "Tokenize, evaluate supported architecture operations and apply sampling rules." },
    { role: "Backend", tool: "Selected ggml CPU / accelerator backend", responsibility: "Execute supported operators and quantized representations." },
    { role: "Placement", tool: "CPU memory and configured device offload", responsibility: "Place model state and work within the actual memory budget." },
  ], firstProof: "Check conversion quality and full-context memory. File size alone does not include KV cache and workspaces." },
];

export function initializeFrameworkMap() {
  const host = document.querySelector<HTMLElement>("#framework-stack-lab");
  if (!host) return;
  const select = host.querySelector<HTMLSelectElement>("[data-fw-route]")!;
  const render = () => {
    const route = frameworkRoutes.find(r => r.id === select.value)!;
    host.querySelector("[data-fw-layers]")!.innerHTML = route.layers.map((layer, i) =>
      `<li><span class="fw-role">${i + 1}. ${layer.role}</span><strong>${layer.tool}</strong><p>${layer.responsibility}</p></li>`).join("");
    host.querySelector("[data-fw-proof]")!.textContent = route.firstProof;
  };
  select.addEventListener("change", render);
  render();
}
