document.getElementById("jsonFileInput").addEventListener("change", handleFileUpload);
document.getElementById("exportButton").addEventListener("click", exportWorkflow);
document.getElementById("downloadGraphButton").addEventListener("click", downloadGraph);
document.getElementById("copyJsonButton").addEventListener("click", copyWorkflowJson);

let workflowData;

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                workflowData = JSON.parse(e.target.result);
                renderGraph(workflowData);
            } catch (error) {
                console.error("Invalid JSON format");
            }
        };
        reader.readAsText(file);
    }
}

function renderGraph(data) {
    const graphContainer = d3.select("#graph");
    graphContainer.html(""); // Clear previous graph
    const width = 1200, height = 800;

    const svg = graphContainer
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(100, 50)");

    if (!data || !data.workflowTasks) {
        console.error("Invalid workflow data format");
        return;
    }

    const tasks = data.workflowTasks;
    const taskMap = {};
    tasks.forEach(task => taskMap[task.taskId] = { ...task, children: [] });

    tasks.forEach(task => {
        if (task.prev && taskMap[task.prev]) {
            taskMap[task.prev].children.push(taskMap[task.taskId]);
        }
    });

    const rootTask = tasks.find(task => !task.prev);
    if (!rootTask) {
        console.error("No root task found in the workflow data");
        return;
    }

    const root = d3.hierarchy(taskMap[rootTask.taskId]);
    root.x0 = height / 2;
    root.y0 = 0;

    const treeLayout = d3.tree().size([height - 200, width - 300]);
    treeLayout(root);

    svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "gray");

    update(root);

    function update(source) {
        const treeData = treeLayout(root);
        const nodes = treeData.descendants();
        const links = treeData.links();

        nodes.forEach(d => d.y = d.depth * 180);

        const node = svg.selectAll("g.node")
            .data(nodes, d => d.data.taskId || (d.data.id = ++i));

        const nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${source.y0},${source.x0})`)
            .on("click", click);

        nodeEnter.append("rect")
            .attr("width", 100)
            .attr("height", 50)
            .attr("fill", d => d3.schemeCategory10[d.depth % 10])
            .attr("rx", 5)
            .attr("ry", 5);

        nodeEnter.append("text")
            .attr("dx", 10)
            .attr("dy", 20)
            .text(d => d.data.type)
            .attr("fill", "#fff");

        nodeEnter.append("text")
            .attr("dx", 10)
            .attr("dy", 40)
            .text(d => `Task: ${d.data.name}`)
            .attr("fill", "#ddd");

        const nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition()
            .duration(200)
            .attr("transform", d => `translate(${d.y},${d.x})`);

        nodeUpdate.select("rect").attr("fill", d => d3.schemeCategory10[d.depth % 10]);

        node.exit().transition()
            .duration(200)
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .remove();

        const link = svg.selectAll("path.link")
            .data(links, d => d.target.data.taskId);

        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", d => {
                const o = { x: source.x0, y: source.y0 };
                return diagonal({ source: o, target: o });
            })
            .attr("stroke", d => d.target.data.nextOnSuccess ? "green" : "red")
            .attr("stroke-width", 2)
            .attr("fill", "none")
            .attr("marker-end", "url(#arrow)")
            .merge(link)
            .transition()
            .duration(200)
            .attr("d", diagonal);

        link.exit().transition()
            .duration(200)
            .attr("d", d => {
                const o = { x: source.x, y: source.y };
                return diagonal({ source: o, target: o });
            })
            .remove();

        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        function click(event, d) {
            d.children = d.children ? null : d._children;
            update(d);
        }
    }

    function diagonal(d) {
        return `M${d.source.y},${d.source.x}
            C${(d.source.y + d.target.y) / 2},${d.source.x}
            ${(d.source.y + d.target.y) / 2},${d.target.x}
            ${d.target.y},${d.target.x}`;
    }
}

function exportWorkflow() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(workflowData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "workflow.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function downloadGraph() {
    const svg = document.querySelector("#graph svg");
    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "workflow_graph.svg");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
}

function copyWorkflowJson() {
    navigator.clipboard.writeText(JSON.stringify(workflowData)).then(() => {
        alert("Workflow JSON copied to clipboard!");
    });
}
