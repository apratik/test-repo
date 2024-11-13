let workflowData = {
    workflowTasks: []
};

// Add a new component (task) to the workflow
document.getElementById("addNewComponentButton").addEventListener("click", () => {
    // Show the popup to add a new component
    document.getElementById("addComponentPopup").classList.remove("hidden");
});

// Add the component to the workflow and render the diagram
document.getElementById("addComponentToGraphButton").addEventListener("click", () => {
    const name = document.getElementById("taskName").value;
    const type = document.getElementById("componentType").value;
    const prev = document.getElementById("prevTask").value;
    const nextSuccess = document.getElementById("nextSuccess").value.split(",").filter(n => n.trim() !== "");
    const nextFailure = document.getElementById("nextFailure").value.split(",").filter(n => n.trim() !== "");

    const taskId = `task-${workflowData.workflowTasks.length + 1}`;

    const newTask = {
        taskId,
        type,
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

// Render the graph as a linked list (linear structure)
function renderGraph() {
    d3.select("#graph").html("");

    const svg = d3.select("#graph").append("svg").attr("width", 1000).attr("height", 400);

    const nodes = workflowData.workflowTasks.map((task, index) => ({
        id: task.taskId,
        type: task.type,
        name: task.name,
        prev: task.prev,
        nextOnSuccess: task.nextOnSuccess,
        nextOnFailure: task.nextFailure,
        x: 200 + (index * 150), 
        y: 100
    }));

    let links = [];
    nodes.forEach(task => {
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
        .attr("class", "node")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("rect")
        .attr("width", 120)
        .attr("height", 40)
        .attr("x", -60)
        .attr("y", -20)
        .attr("rx", 6)
        .attr("ry", 6)
        .attr("fill", "#3b8e8d");

    node.append("text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text(d => `${d.type} - ${d.id}`);

    node.append("foreignObject")
        .attr("width", 100)
        .attr("height", 30)
        .attr("x", -50)
        .attr("y", 20)
        .append("xhtml:button")
        .text("Delete")
        .on("click", function(event, d) {
            deleteComponent(d.id);
        });

    svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 10)
        .attr("refY", 0)
        .attr("markerWidth", 8)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#999");

    simulation.on("tick", () => {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

// Delete a component and update the graph
function deleteComponent(taskId) {
    workflowData.workflowTasks = workflowData.workflowTasks.filter(task => task.taskId !== taskId);
    renderGraph();
}

// Export the workflow as a JSON file
document.getElementById("exportButton").addEventListener("click", () => {
    const json = JSON.stringify(workflowData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "workflow.json";
    link.click();
});

// Download the graph as an SVG file
document.getElementById("downloadGraphButton").addEventListener("click", () => {
    const svg = document.querySelector("#graph svg");
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "workflow.svg";
    link.click();
});

// Copy the workflow JSON to clipboard
document.getElementById("copyJsonButton").addEventListener("click", () => {
    const json = JSON.stringify(workflowData, null, 2);
    navigator.clipboard.writeText(json).then(() => {
        alert("Workflow JSON copied to clipboard!");
    });
});
