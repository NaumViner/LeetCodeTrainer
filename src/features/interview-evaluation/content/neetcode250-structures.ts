import { draft as q } from "./define";

// Trees in examples use compact level order: consume two children only for a
// non-null queued parent. List arrays represent linked nodes, not random access.
const tree =
  "Trees use compact level-order arrays with null for absent children; trailing nulls may be omitted.";
export const extendedStructureQuestions = {
  "single-threaded-cpu": q(
    "Task i is [enqueueTime,processingTime]. A single CPU runs an available task with shortest processing time, breaking ties by original index. Running tasks cannot be interrupted. If none is available, time advances to the next arrival. Return processing indices in order.",
    [
      "1 <= tasks.length <= 100,000; positive times <= 1,000,000,000; use wide arithmetic for accumulated time.",
    ],
    [
      "Add every task arriving by current time before choosing the next task.",
      "A heap ordered by duration then index and arrival sorting gives O(n log n).",
    ],
    [
      {
        tasks: [
          [1, 2],
          [2, 4],
          [3, 2],
          [4, 1],
        ],
      },
      [0, 2, 3, 1],
    ],
    [
      {
        tasks: [
          [5, 2],
          [5, 2],
        ],
      },
      [0, 1],
    ],
  ),
  "reorganize-string": q(
    "Rearrange every character of s so adjacent characters differ. Return any such string, or an empty string when impossible.",
    ["1 <= s.length <= 500; lowercase English letters."],
    [
      "No frequency may exceed ceil(n/2) in a feasible arrangement.",
      "Delay reusing the previously emitted character while preserving all input multiplicities.",
    ],
    [{ s: "aab" }, "aba"],
    [{ s: "aaaa" }, ""],
  ),
  "longest-happy-string": q(
    "Construct a longest string using at most a copies of 'a', b copies of 'b' and c copies of 'c', with no three consecutive equal characters. Return any maximum-length valid string; unused characters are allowed.",
    ["0 <= a,b,c <= 100; a+b+c > 0."],
    [
      "Prefer the largest available count unless it creates a triple, then use another character.",
      "Stop only when no legal next character remains; optimize length rather than using every character at any cost.",
    ],
    [{ a: 1, b: 1, c: 7 }, "ccaccbcc"],
    [{ a: 0, b: 0, c: 3 }, "cc"],
  ),
  "car-pooling": q(
    "Trips are [passengers,from,to], with from < to along a one-way route. Passengers leave at to before new passengers board there. Return whether one vehicle of the given capacity can serve every trip.",
    [
      "0 <= trips.length <= 1,000; 1 <= passengers <= 100; 0 <= from < to <= 1,000; 1 <= capacity <= 100,000.",
    ],
    [
      "Aggregate pickup and dropoff deltas at each location.",
      "Only the onboard count between locations matters; equal-location dropoffs free capacity for pickups.",
    ],
    [
      {
        trips: [
          [2, 1, 5],
          [3, 3, 7],
        ],
        capacity: 4,
      },
      false,
    ],
    [
      {
        trips: [
          [2, 1, 5],
          [3, 5, 7],
        ],
        capacity: 3,
      },
      true,
    ],
  ),
  ipo: q(
    "Start with capital w and choose at most k distinct projects. Project i requires current capital >= capital[i]; completing it adds profits[i] without deducting its capital requirement. Return maximum final capital.",
    [
      "0 <= k <= 100,000; 1 <= profits.length=capital.length <= 100,000; nonnegative values <= 1,000,000,000; use wide arithmetic.",
    ],
    [
      "Move all affordable projects into a max-profit heap before each selection.",
      "With nonnegative profits the largest affordable profit cannot reduce future options; stop if no project is affordable.",
    ],
    [{ k: 2, w: 0, profits: [1, 2, 3], capital: [0, 1, 1] }, 4],
    [{ k: 2, w: 0, profits: [5], capital: [1] }, 0],
  ),
  "meeting-rooms-iii": q(
    "There are n rooms numbered 0..n-1. Meetings have distinct original start times and intervals [start,end). Process in original start order. Assign the lowest-numbered free room; if none is free, delay the meeting until the earliest room release, preserving duration and breaking room ties by number. Return the room hosting most meetings, breaking ties by smallest number.",
    [
      "1 <= n <= 100; 1 <= meetings.length <= 100,000; 0 <= start < end <= 500,000; accumulated end times require wide arithmetic.",
    ],
    [
      "Release all rooms whose finish time is <= the current original start.",
      "Delayed meetings retain original priority; track finish time and room number separately from usage counts.",
    ],
    [
      {
        n: 2,
        meetings: [
          [0, 10],
          [1, 5],
          [2, 7],
          [3, 4],
        ],
      },
      0,
    ],
    [
      {
        n: 3,
        meetings: [
          [1, 2],
          [2, 3],
          [3, 4],
        ],
      },
      0,
    ],
  ),
  "reverse-linked-list-ii": q(
    "Reverse the singly linked list segment from 1-based position left through right in place and return the head. Keep all other nodes in their original order. Examples encode linked nodes as arrays.",
    ["1 <= left <= right <= number of nodes <= 500; integer node values."],
    [
      "Reconnect both boundaries of the reversed segment without losing the suffix.",
      "Use constant auxiliary space and handle a segment starting at the head.",
    ],
    [{ head: [1, 2, 3, 4, 5], left: 2, right: 4 }, [1, 4, 3, 2, 5]],
    [{ head: [8], left: 1, right: 1 }, [8]],
  ),
  "design-circular-queue": q(
    "Implement a fixed-capacity circular queue of size k. enQueue(value) returns false when full, otherwise inserts and returns true; deQueue() removes the front and returns success. Front()/Rear() return the value or -1 if empty; isEmpty()/isFull() return booleans. Start empty; do not use a built-in queue.",
    [
      "1 <= k <= 1,000; at most 10,000 operations; inserted values are nonnegative integers.",
    ],
    [
      "Use modulo indexing with explicit size or an equivalent unambiguous full/empty representation.",
      "Failed operations preserve state; all operations should take O(1) time.",
    ],
    [
      {
        k: 2,
        ops: [
          ["enQueue", 4],
          ["enQueue", 7],
          ["enQueue", 9],
          ["Rear"],
          ["deQueue"],
          ["enQueue", 9],
          ["Front"],
          ["Rear"],
        ],
      },
      [true, true, false, 7, true, true, 7, 9],
    ],
    [
      {
        k: 1,
        ops: [["isEmpty"], ["Front"], ["deQueue"], ["enQueue", 2], ["isFull"]],
      },
      [true, -1, false, true, true],
    ],
  ),
  "lfu-cache": q(
    "Implement an initially empty cache of the given capacity with get(key) and put(key,value). Missing get returns -1. Successful get and updates to existing keys increment frequency and mark the key most recently used. New keys start at frequency 1. When full, insertion evicts the least frequent key, breaking ties by least recent use. put returns null; require expected O(1) per operation.",
    [
      "0 <= capacity <= 10,000; at most 100,000 operations; nonnegative integer keys and values.",
    ],
    [
      "Maintain frequency buckets with LRU order and a minimum nonempty frequency.",
      "Existing-key updates count as access; capacity zero stores nothing.",
    ],
    [
      {
        capacity: 2,
        ops: [
          ["put", 1, 10],
          ["put", 2, 20],
          ["get", 1],
          ["put", 3, 30],
          ["get", 2],
          ["get", 3],
          ["put", 4, 40],
          ["get", 1],
          ["get", 4],
        ],
      },
      [null, null, 10, null, -1, 30, null, -1, 40],
    ],
    [
      {
        capacity: 0,
        ops: [
          ["put", 1, 2],
          ["get", 1],
        ],
      },
      [null, -1],
    ],
  ),
  "binary-tree-inorder-traversal": q(
    "Return binary tree values in inorder: left subtree, node, right subtree. Describe an iterative solution as well as the recursive ordering.",
    ["0 <= nodes <= 100; integer values.", tree],
    [
      "A stack simulates the recursive return path from left descendants.",
      "Visit each node once; tree values need not satisfy BST ordering.",
    ],
    [{ root: [2, 1, 3] }, [1, 2, 3]],
    [{ root: [] }, []],
  ),
  "binary-tree-preorder-traversal": q(
    "Return binary tree values in preorder: node, left subtree, right subtree. Describe how an explicit stack preserves this ordering.",
    ["0 <= nodes <= 100; integer values.", tree],
    [
      "Emit the node before descending into children.",
      "When using a LIFO stack, push right before left to visit left first.",
    ],
    [{ root: [2, 1, 3] }, [2, 1, 3]],
    [{ root: [] }, []],
  ),
  "binary-tree-postorder-traversal": q(
    "Return binary tree values in postorder: left subtree, right subtree, node. Describe how to implement the traversal without recursion.",
    ["0 <= nodes <= 100; integer values.", tree],
    [
      "Emit each parent after both subtrees.",
      "An iterative solution must distinguish first arrival from return after children, or reverse an appropriate traversal.",
    ],
    [{ root: [2, 1, 3] }, [1, 3, 2]],
    [{ root: [] }, []],
  ),
  "insert-into-a-binary-search-tree": q(
    "Insert a value absent from a binary search tree and return its root. Any resulting valid BST containing exactly the original values plus val is acceptable; examples use insertion at an empty child position.",
    ["0 <= nodes <= 10,000; distinct signed 32-bit values and val.", tree],
    [
      "Use strict BST comparisons to locate an insertion position.",
      "Preserve every original value and handle an empty root; iterative descent avoids recursion-depth issues on skewed trees.",
    ],
    [{ root: [4, 2, 7, 1, 3], val: 5 }, [4, 2, 7, 1, 3, 5]],
    [{ root: [], val: 6 }, [6]],
  ),
  "delete-node-in-a-bst": q(
    "Delete the node with value key from a BST if present, and return the resulting root. Any valid BST containing precisely the remaining values is accepted. Examples choose the inorder successor for a deleted node with two children.",
    ["0 <= nodes <= 10,000; distinct signed 32-bit values.", tree],
    [
      "Handle zero, one and two children while maintaining strict subtree bounds.",
      "When replacing with a successor or predecessor, remove its original occurrence too; an absent key leaves the value set unchanged.",
    ],
    [{ root: [5, 3, 6, 2, 4, null, 7], key: 3 }, [5, 4, 6, 2, null, null, 7]],
    [{ root: [1], key: 1 }, []],
  ),
  "construct-quad-tree": q(
    "Construct a quadtree for a square binary grid. A uniform region becomes {isLeaf:true,val:0 or 1}. Otherwise use {isLeaf:false,children:[topLeft,topRight,bottomLeft,bottomRight]}, recursively splitting into four equal squares. Internal-node values are omitted in this example notation; if your node API requires one, either value is acceptable.",
    ["Grid side is a power of two from 1 to 64; entries are 0 or 1."],
    [
      "A leaf represents a completely uniform region.",
      "Quadrant order and boundaries must cover every cell exactly once; compress uniform regions rather than retaining unnecessary internal nodes.",
    ],
    [
      {
        grid: [
          [1, 1],
          [1, 1],
        ],
      },
      { isLeaf: true, val: 1 },
    ],
    [
      {
        grid: [
          [0, 1],
          [1, 0],
        ],
      },
      {
        isLeaf: false,
        children: [
          { isLeaf: true, val: 0 },
          { isLeaf: true, val: 1 },
          { isLeaf: true, val: 1 },
          { isLeaf: true, val: 0 },
        ],
      },
    ],
  ),
  "house-robber-iii": q(
    "Choose tree nodes with maximum total value such that no chosen node has a chosen parent. Return that maximum sum; choosing no nodes is allowed.",
    ["0 <= nodes <= 10,000; 0 <= values <= 10,000.", tree],
    [
      "For each subtree compute best totals with its root taken and skipped.",
      "Taking a node excludes both children; skipping permits each child's better state independently.",
    ],
    [{ root: [3, 2, 3, null, 3, null, 1] }, 7],
    [{ root: [] }, 0],
  ),
  "delete-leaves-with-a-given-value": q(
    "Repeatedly remove every leaf whose value equals target until no such leaves remain, and return the resulting root. A parent newly becoming a matching leaf must also disappear.",
    ["0 <= nodes <= 3,000; integer values.", tree],
    [
      "Process children before deciding whether their parent is now a matching leaf.",
      "Matching internal nodes stay when a surviving child remains; the root may be removed.",
    ],
    [{ root: [1, 2, 3, 2, null, 2, 4], target: 2 }, [1, null, 3, null, 4]],
    [{ root: [2, 2, 2], target: 2 }, []],
  ),
};
