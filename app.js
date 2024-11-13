let workflowData = {
    workflowTasks: []
};

// Show the popup for adding a new component
document.getElementById("addNewComponentButton").addEventListener("click", () => {
    document.getElementById("addComponentPopup").classList.remove("hidden");
});

// Add component to graph
document.getElementById("addComponentToGraphButton").addEventListener("click", () => {
    const name = document.getElementById("taskName").value;
    const prev = document.getElementById("prevTask").value;
    const nextSuccess = document.getElementById("nextSuccess").value.split(",").filter(n => n.trim() !== "");
    const nextFailure = document.getElementById("nextFailure").value.split(",").filter(n => n.trim() !== "");

    const taskId = `task-${workflowData.workflowTasks.length + 1}`;

    const newTask = {
        taskId,
        name,
        prev: prev || null,
        nextOnSuccess: nextSuccess.length > 0 ? nextSuccess : null,
        nextOnFailure: nextFailure.length > 0 ? nextFailure : null
    };

    workflowData.workflowTasks.push(newTask);
    document.getElementById("addComponentPopup").classList.add("hidden");
    renderGraph();
});

// Close the popup
document.getElementById("closePopupButton").addEventListener("click", () => {
    document.getElementById("addComponentPopup").classList.add("hidden");
});

// Render the graph as a linked list
function renderGraph() {
    d3.select("#graph").html(""); // Clear previous graph

    const svg = d3.select("#graph").append("svg").attr("width", 1000).attr("height", 400);

    const nodes = workflowData.workflowTasks.map((task, index) => ({
        id: task.taskId,
        name: task.name,
        prev: task.prev,
        x: 200 + (index * 200),
        y: 100
    }));

    let links = [];
    nodes.forEach(task => {
        if (task.prev) {
            links.push({ source: task.prev, target: task.id, type: "success" });
        }
        if (task.nextOnSuccess) {
            task.nextOnSuccess.forEach(n => {
                links.push({ source: task.id, target: n, type: "success" });
            });
        }
        if (task.nextOnFailure) {
            task.nextOnFailure.forEach(n => {
                links.push({ source: task.id, target: n, type: "failure" });
            });
        }
    });

    const link = svg.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke", d => d.type === "success" ? "green" : "red")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow)");

    const node = svg.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node");

    node.append("rect")
        .attr("width", 120)
        .attr("height", 40)
        .attr("x", -60)
        .attr("y", -20)
        .attr("rx", 6)
        .attr
