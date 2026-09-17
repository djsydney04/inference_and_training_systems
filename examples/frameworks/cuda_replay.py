# Complete CUDA-only correctness example; device execution unverified here.
import torch

if not torch.cuda.is_available():
    raise RuntimeError("This example requires a compatible CUDA device")

static_x = torch.ones(4, device="cuda")
warm_stream = torch.cuda.Stream()
warm_stream.wait_stream(torch.cuda.current_stream())
with torch.cuda.stream(warm_stream):
    for _ in range(3):
        warm_y = static_x.square() + 1
torch.cuda.current_stream().wait_stream(warm_stream)

graph = torch.cuda.CUDAGraph()
with torch.cuda.graph(graph):
    static_y = static_x.square() + 1

for values in ([2., 3., 4., 5.], [-1., 0., 1., 2.]):
    fresh_x = torch.tensor(values, device="cuda")
    static_x.copy_(fresh_x)       # update captured storage, same shape/dtype
    graph.replay()               # reads static_x; overwrites static_y
    # Clone if the result must survive another replay into static_y.
    saved_y = static_y.clone()
    torch.cuda.synchronize()
    torch.testing.assert_close(saved_y, fresh_x.square() + 1)

# static_x = fresh_x would only rebind the Python variable.
# It would not retarget the input pointer already recorded in this graph.
