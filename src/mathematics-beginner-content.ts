import { sourceLink as ref, workedCheck as check } from "./lesson-template";
import { attentionPage, derivativePage, dotProductPage, matrixProductPage, transposePage, vectorPage } from "./mathematics-figures";

export const numberAndVectorLesson = `
<section class="lesson" id="numbers-and-vectors" data-lesson="Start here: numbers and vectors">
<header><span>No linear algebra required</span><h3>A vector is a list of numbers with an agreed order</h3></header>
<p>This chapter assumes you can add, subtract, multiply and divide ordinary numbers. You do not need to know vectors, matrices, probability or calculus. Keep paper nearby: copy a worked example, cover its answer, and calculate it yourself. A calculator is useful when we reach square roots, exponentials and logarithms.</p>
<p><strong>Linear algebra</strong> studies vectors and the rules for combining them. Models use it to turn one list of features into another. We will begin with the lists, then build up to the equations. A feature is one numerical coordinate used by the model; a learned feature does not necessarily stand for a recognizable idea such as “plural” or “animal.”</p>
<h4>One number, a list, and a table</h4>
<p>A <strong>scalar</strong> is a single number, such as 3, −2 or 0.5. A letter can name that number: if a=3, then 2a means 2×3=6. A <strong>vector</strong> is an ordered list of numbers. In x=[3,4], the first coordinate is 3 and the second is 4. The order matters: [3,4] and [4,3] are different vectors. This vector has two coordinates, so we call it two-dimensional.</p>
<p>A <strong>matrix</strong> is a rectangular table of numbers. Rows run across; columns run down. A matrix with two rows and three columns has <strong>shape [2,3]</strong> and contains 2×3=6 numbers. Shape describes the arrangement, not the values. A <strong>tensor</strong>, as used in this book’s programs, is an array that may have any number of axes: a scalar has zero axes, a vector has one, and a matrix has two.</p>
<div class="method-table"><table><caption>Read the notation one piece at a time</caption><thead><tr><th>Notation</th><th>Say it in words</th><th>Example</th></tr></thead><tbody>
<tr><th>x=[3,4]</th><td>A vector named x, containing two coordinates</td><td>Its shape is [2]; its values are 3 and 4.</td></tr>
<tr><th>x[0], x[1]</th><td>Select a coordinate, counting from zero</td><td>x[0]=3 and x[1]=4.</td></tr>
<tr><th>A[1,2]</th><td>Select a row, then a column</td><td>The second row, third column of A.</td></tr>
<tr><th>x²; √x</th><td>x squared; square root of x</td><td>3²=3×3=9; √9=3.</td></tr>
<tr><th>=; ≈</th><td>Exactly equal; approximately equal</td><td>½=0.5; ⅓≈0.3333.</td></tr>
<tr><th>x ∈ ℝ²</th><td>x is a vector of two real numbers</td><td>ℝ includes fractions and negative numbers; the 2 counts coordinates.</td></tr>
</tbody></table></div>
<p>We use zero-based bracket indices for array entries. Some mathematical formulas instead label coordinates x₁ and x₂, starting at one: those refer to the same first and second positions. A subscript labels an entry; a superscript such as the 2 in x² usually means a power. We will define other superscripts, such as the transpose symbol T, when they appear.</p>
<h4>Add or scale one coordinate at a time</h4>
<p>Vector addition matches positions: <code>[3,4]+[−1,2]=[3+(−1),4+2]=[2,6]</code>. Multiplication by a scalar scales every position: <code>2[3,4]=[6,8]</code>. Subtraction also matches positions: <code>[3,4]−[−1,2]=[4,2]</code>. Ordinary vector addition requires equal lengths. Later, <a href="#indices-and-reductions">broadcasting</a> will introduce explicit array rules for reusing shorter inputs.</p>
${vectorPage}
<p>One way to picture [3,4] is an arrow from the origin, the point [0,0], to the point three units right and four units up. Its straight-line length is <code>√(3²+4²)=5</code>, using the right-triangle rule. The list interpretation works even when there are thousands of coordinates and no convenient drawing. “Two-dimensional vector” describes two coordinates; “two-dimensional array” describes two axes. They are different uses of the word dimension.</p>
${check("Try it: for x=[2,−3] and y=[−1,5], calculate x+y, 3x, and x−y.", "Match the coordinates: x+y=[2−1,−3+5]=[1,2]; 3x=[6,−9]; x−y=[2−(−1),−3−5]=[3,−8]. Subtracting a negative adds its magnitude.")}
${check("A has shape [2,3]. Does that tell you that it contains the numbers 2 and 3?", "No. It tells you there are two rows and three columns, for six entries. The six values have not been specified. A two-coordinate vector has shape [2], which is a different object.")}
<p>Next, combine two vectors into one number. This operation is the small calculation repeated inside matrix multiplication.</p>
${ref("https://www.deeplearningbook.org/contents/linear_algebra.html", "Deep Learning, chapter 2: scalars, vectors and matrices")}
</section>`;

export const dotProductLesson = `
<section class="lesson" id="dot-products-by-hand" data-lesson="Dot products, one pair at a time">
<header><span>A weighted sum</span><h3>Multiply matching entries, then add the products</h3></header>
<p>Suppose a basket contains two apples and three pears, priced at 4 and 5 units each. Its total price is 2×4+3×5=23. The quantities [2,3] and prices [4,5] are vectors; the total is their <strong>dot product</strong>. Every quantity must meet the price of the same item. Reordering only one list changes the question.</p>
<p>For x=[2,−1,3] and w=[4,5,−2], first multiply coordinate pairs: 2×4=8, (−1)×5=−5, and 3×(−2)=−6. Then add: 8−5−6=−3. We write <code>x·w=−3</code>. Negative coordinates are allowed; a dot product can be negative, zero or positive. Both input vectors must have the same length.</p>
${dotProductPage}
<h4>A dot product produces a scalar</h4>
<p><strong>Elementwise multiplication</strong> stops before the sum. For these same vectors it gives <code>x⊙w=[8,−5,−6]</code>, a vector with three entries. The symbol ⊙ distinguishes it from the dot product. In common array code, <code>x * w</code> means elementwise multiplication, while a dot-product or matrix-product operation performs a reduction. Read the library’s operation and shapes instead of assuming that every multiplication sign does the same thing.</p>
<p>Now compress the arithmetic into notation. Let D be the number of coordinates. Then <code>x·w = Σ(i=0…D−1) x[i]w[i]</code>. The Greek letter Σ, pronounced “sigma,” means add the terms. For D=3, expand it as <code>x[0]w[0]+x[1]w[1]+x[2]w[2]</code>. Each juxtaposed pair is multiplied. D−1 is 2 because our labels start at zero.</p>
<h4>Why a model uses this calculation</h4>
<p>A weight vector says how strongly each input contributes to one output. In the example, increasing x[0] by one increases the result by 4 if the other values stay fixed. Increasing x[1] by one increases it by 5; increasing x[2] by one decreases it by 2. A negative weight is a subtractive contribution, not an invalid weight. A <strong>bias</strong> is an extra scalar added afterward: with bias 2, the output is −3+2=−1.</p>
<p>A weighted sum is not automatically an average. Attention will use nonnegative weights that sum to one, but ordinary learned matrix entries need satisfy neither condition.</p>
${check("Try it: [1,2,−1]·[3,0,4] = ? What is the elementwise product?", "The pairwise products are [3,0,−4]. Adding them gives the dot product −1. The elementwise product keeps the vector [3,0,−4].")}
${check("If x=[3,4], what is x·x, and why is it not the length 5?", "x·x=3×3+4×4=25. A vector dotted with itself gives its squared Euclidean length. Take the square root to get 5.")}
</section>`;

export const matrixProductLesson = `
<section class="lesson" id="matrix-products-by-hand" data-lesson="Matrices, multiplication and transpose">
<header><span>Repeat the dot product</span><h3>One row and one column make one output entry</h3></header>
<p>A matrix multiplication performs many dot products and arranges their answers in a table. Write <code>C=AB</code> or, in array code, <code>C=A @ B</code>. Choose a row of A and a column of B, multiply their matching entries, and add. Put that scalar at the chosen row and column of C. Repeat until every output entry is filled.</p>
<p>Let A have rows [2,−1,3] and [0,4,1]. Let B have rows [4,1], [5,2] and [−2,3]. B’s <em>columns</em> are [4,5,−2] and [1,2,3]. The first row of A with the first column of B is the dot product we just calculated: −3.</p>
${matrixProductPage}
<p>Read the result row by row: <code>C=[[-3,9],[18,11]]</code>. The first row is [−3,9]; the second is [18,11]. The first row’s second result, for example, is 2×1+(−1)×2+3×3=2−2+9=9. Computing only one entry correctly is not enough: there are four separate dot products here.</p>
<h4>Check the shapes before doing arithmetic</h4>
<p>A is [2,3] and B is [3,2]. The inner lengths must match because each pair of lists in a dot product must have equal length. The outer lengths become the result: <code>[2,3] × [3,2] → [2,2]</code>. More generally, <code>[M,K] × [K,N] → [M,N]</code>. M counts output rows, N counts output columns, and K counts the products added into each entry. These letters are counts, not numbers to multiply into the entries.</p>
<p>For one input vector, we deliberately use a <strong>row-vector convention</strong>: treat x=[3,4] as a matrix of shape [1,2]. If W has rows [1,0,−1] and [2,1,0], then <code>xW=[11,4,−3]</code>, of shape [1,3]. Each column of W makes one output feature. When several input rows use W, they all reuse the same six weights; more input rows do not create more parameters.</p>
<h4>Transpose changes the arrangement</h4>
<p>The <strong>transpose</strong> of A, written Aᵀ, exchanges rows and columns. Its entry rule is <code>Aᵀ[j,i]=A[i,j]</code>. A [2,3] matrix becomes [3,2]. Every original row becomes a column without changing any number.</p>
${transposePage}
<p>Some books put vectors in columns and write Wx instead. That is a valid convention, but it requires the corresponding weight arrangement. Our row expression xW transposes to <code>(xW)ᵀ=Wᵀxᵀ</code>; the order reverses. A one-dimensional array in software may have no row or column axis at all, so check how its library handles <code>@</code> and transpose. PyTorch’s <code>nn.Linear</code> stores weights as [output width,input width] and applies their transpose to input rows.</p>
<h4>Order matters; transpose is not inverse</h4>
<p>Matrix multiplication is generally not commutative: AB need not equal BA. In the full example, AB is [2,2], while BA is [3,3], already making equality impossible. Sometimes the reverse product is not even defined. Even square matrices can disagree: if S has rows [2,0],[0,1] and R has rows [0,1],[1,0], then SR has rows [0,2],[1,0], while RS has rows [0,1],[2,0]. Scaling then swapping coordinates differs from swapping then scaling.</p>
<p>The <strong>identity matrix</strong> I has ones on its main diagonal and zeros elsewhere: for two coordinates, its rows are [1,0] and [0,1]. Check that [3,4]I=[3,4]. An <strong>inverse</strong> W⁻¹, when a square W has one, satisfies WW⁻¹=W⁻¹W=I and reverses its transformation. For a matrix that doubles both coordinates, W=2I, the transpose is still 2I; the inverse is ½I. A transpose rearranges entries. An inverse solves a different problem, and it does not always exist.</p>
${check("Try it: A has rows [1,2],[3,4]; B has rows [2,0],[−1,5]. Calculate all four entries of AB.", "First row: [1×2+2×(−1), 1×0+2×5]=[0,10]. Second row: [3×2+4×(−1), 3×0+4×5]=[2,20]. Thus AB has rows [0,10] and [2,20].")}
${check("Can [2,3] multiply [2,4]? What about [2,3] multiplied by [3,4]?", "The first matrix product is undefined: the inner lengths 3 and 2 differ. The second is valid and produces [2,4]. Matching only the number of rows does not establish a valid product.")}
${ref("https://www.deeplearningbook.org/contents/linear_algebra.html", "Deep Learning, chapter 2: products, transpose and inverse")}
${ref("https://docs.pytorch.org/docs/2.8/generated/torch.nn.Linear.html", "PyTorch 2.8: the stored weight convention for Linear")}
</section>`;

export const attentionByHandLesson = `
<section class="lesson" id="softmax-and-attention-by-hand" data-lesson="From scores to attention, by hand">
<header><span>Put the operations together</span><h3>Attention computes scores, then a weighted mixture</h3></header>
<p>You now know enough linear algebra to calculate a small attention operation. Its inputs are a <strong>query</strong> q, <strong>keys</strong> k and <strong>values</strong> v. The query is the vector at the position asking for information. Each key is a vector used to score one position; that position’s value is the vector that can be mixed into the result. A real model produces these vectors with learned matrix multiplications.</p>
<h4>First, meet the exponential function</h4>
<p>A function takes an input and returns an output. The exponential function <code>exp(z)=eᶻ</code> uses the fixed number e≈2.71828 as its base. On a calculator it may be labeled eˣ. You only need three facts here: exp(0)=1, every finite real input gives a positive result in exact arithmetic, and a larger input gives a larger result. Negative inputs are allowed: exp(−1)≈0.3679. The inverse operation, ln, answers which exponent produced a positive number: ln(1)=0 and ln(e)=1.</p>
<p><strong>Softmax</strong> converts a list of real scores into nonnegative weights that sum to one. Exponentiate every score, add those exponentials, then divide each exponential by the sum. In symbols, <code>p[i]=exp(s[i])/Σⱼ exp(s[j])</code>. The i chooses the result being computed; j visits every score in the denominator. For equal scores [0,0], exponentials are [1,1], the sum is 2, and the weights are [½,½].</p>
<h4>One query, two possible sources</h4>
<p>Choose q=[1,0], k₀=[0,1] and k₁=[2,0]. The dot products are 0 and 2. Scaled dot-product attention divides each score by √dₖ, where dₖ is the number of coordinates in a query or key. Here dₖ=2, so the scores are [0,√2], since 2/√2=√2≈1.4142. This denominator is the key width, not the number of keys. It helps keep the size of scores from growing simply because the vectors have more coordinates.</p>
<details class="deep-dive"><summary>Why the square root? Return after the variance lesson</summary><p>Under the simplifying assumption that all query and key components are independent random variables with mean zero and variance one, each paired product has variance one. A sum of dₖ such products has variance dₖ; dividing the sum by √dₖ gives variance one. This motivates the scaling without claiming learned components always satisfy the assumptions. The <a href="#expectation-and-batches">variance lesson</a> explains these quantities and the rule for scaling variance.</p></details>
${attentionPage}
<p>Subtracting the same constant from every score leaves softmax unchanged. The drawing subtracts the maximum before exponentiating so the numbers stay small; the <a href="#numerical-reasoning">numerical lesson</a> proves why this works. The resulting weights are approximately [0.1956,0.8044]. They sum to one apart from rounding.</p>
<p>Now use values v₀=[2,0] and v₁=[0,4]. Multiply each <em>whole value vector</em> by its weight, then add the vectors. The first output coordinate is 0.19557…×2+0.80443…×0≈0.3911. The second is 0.19557…×0+0.80443…×4≈3.2177. This produces a two-coordinate vector, not the index of a winning token. The attention weights describe how this query mixes these values; they are not the model’s final next-token probabilities.</p>
<h4>Read the compact equation after doing the example</h4>
<p>Stack queries as the rows of Q[Tq,dₖ], keys as the rows of K[Tk,dₖ], and values as the rows of V[Tk,dᵥ]. Tq and Tk count query and key positions; dᵥ counts value coordinates and may differ from dₖ. Then <code>QKᵀ</code> has shape [Tq,Tk]: one dot product per query–key pair. Apply softmax <em>separately to each row</em> of the scaled scores. Multiplying the resulting [Tq,Tk] weight matrix by V gives [Tq,dᵥ]. This is <code>attention(Q,K,V)=softmax(QKᵀ/√dₖ)V</code> for allowed, unmasked keys.</p>
<p>A <strong>mask</strong> excludes disallowed keys before normalization. A causal decoder must not use future positions. If only the first key in our example is permitted, its weight is 1 and the second weight is 0; the output is exactly [2,0]. Do not compute [0.1956,0.8044] and merely zero the second entry afterward: the remaining weight would not sum to one. An entirely excluded row needs explicitly defined behavior because there is nothing to normalize.</p>
${check("Try it: with equal scores and values [2,0] and [0,4], what is the attention output?", "Equal scores give weights [½,½]. The output is ½[2,0]+½[0,4]=[1,2]. Both coordinates are calculated separately using the same two weights.")}
${check("Q is [3,4], K is [5,4], and V is [5,2]. What are the score and output shapes, and what is the scale divisor?", "Kᵀ is [4,5], so QKᵀ is [3,5]. Each of the three rows normalizes across five keys. Multiplication by V gives [3,2]. The divisor is √4=2, because the key width is four.")}
${ref("https://arxiv.org/abs/1706.03762", "Vaswani et al., section 3.2.1: scaled dot-product attention")}
</section>`;

export const derivativeLesson = `
<section class="lesson" id="derivatives-from-scratch" data-lesson="Derivatives and gradients from zero">
<header><span>How much does one change affect another?</span><h3>A derivative is a local rate of change</h3></header>
<p>Training needs more than the value of a loss. It needs to know how changing a weight would change that loss. Start with an ordinary slope: if a function’s output rises by 6 when its input rises by 2, its average rate of change across that step is 6/2=3. A <strong>derivative</strong> asks what that rate approaches as the step becomes arbitrarily small.</p>
<p>For f(w)=w², start at w=2, where f(2)=4. A step of 0.1 produces 2.1²=4.41, a change of 0.41. Divide by 0.1 to get a rate of 4.1. A step of 0.01 produces 4.0401, a rate of 4.01. These rates approach 4. The drawing shows the algebra that works for any nonzero step h.</p>
${derivativePage}
<p>Repeating the expansion at an arbitrary w gives <code>[(w+h)²−w²]/h=2w+h</code>. As h approaches zero, the derivative is 2w. The notations <code>f′(w)</code> and <code>df/dw</code> both name it. At w=2, a small change h predicts <code>f(2+h)≈4+4h</code>. The omitted h² is why this is an approximation for a finite step.</p>
<h4>A partial derivative changes one input at a time</h4>
<p>For f(x,w)=wx, changing x while holding w fixed gives <code>∂f/∂x=w</code>. Changing w while holding x fixed gives <code>∂f/∂w=x</code>. The curly ∂, pronounced “partial,” reminds us that the function has several inputs and we are varying one. At x=2, w=3, the output is 6: adding 0.01 to x adds 0.03 to the output, while adding 0.01 to w adds 0.02.</p>
<p>A <strong>gradient</strong> collects all the partial derivatives of a scalar function. For L(a,b)=a²+3b at a=2, b=1, the loss is 7 and the gradient is [4,3]. In a model, θ (theta) names all its parameters and ∇θL, read “gradient of L with respect to theta,” collects their derivatives in the same shapes as the parameters. A gradient is neither the parameter itself nor the updated parameter.</p>
<h4>Why gradient descent subtracts</h4>
<div class="derivation"><h4>One weight, one complete update</h4><p>Let L(w)=(w−3)². This loss is zero at w=3. At w=1 it is 4 and its derivative is 2(w−3)=−4. Choose learning rate η=0.1, where η (eta) is the step-size multiplier. Then <code>w_new=w−η(dL/dw)=1−0.1×(−4)=1.4</code>. The new loss is (1.4−3)²=2.56.</p><p>A negative derivative says that a small positive weight change lowers the loss. Subtracting a negative derivative therefore increases the weight. A positive derivative produces the opposite direction. A large step can overshoot: η=2 would move this same weight to 9 and increase the loss to 36. The derivative describes local behavior, not a guarantee for every step size.</p></div>
<p>For several parameters, the first-order loss change is the dot product of the gradient with the parameter change. Choosing the change −η∇L makes that first-order term −η‖∇L‖₂², which is negative for a nonzero gradient and positive η. This explains the direction; it still leaves the choice of a sufficiently small step. A zero gradient alone does not prove a minimum.</p>
${check("Try it: for L(w)=(w−3)² at w=5 and η=0.1, calculate the derivative, new weight and new loss.", "The derivative is 2(5−3)=4. The new weight is 5−0.1×4=4.6. The new loss is (4.6−3)²=2.56, down from 4. The positive derivative makes descent reduce the weight.")}
${check("At a=−1, b=2, what are L(a,b)=a²+3b and its gradient?", "The value is 1+6=7. Holding b fixed gives ∂L/∂a=2a=−2. Holding a fixed gives ∂L/∂b=3. The gradient is [−2,3], not [−1,2] and not the scalar 7.")}
<p>Next, follow rates through several operations. The chain rule connects these local derivatives to the loss of a whole network.</p>
${ref("https://d2l.ai/chapter_preliminaries/calculus.html", "Dive into Deep Learning: derivatives, partial derivatives and gradients")}
</section>`;
