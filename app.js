document.addEventListener("DOMContentLoaded", function () {
    let workflowData;

    // Handle file upload
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

    // Render graph based on the workflow data
    function renderGraph(data) {
        const graphContainer = d3.select("#graph");
        graphContainer.html(""); // Clear previous graph
        const width = 3000, height = 1500; // Increased width and height for large graphs

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

        // Initialize taskMap with tasks and empty children arrays
        tasks.forEach(task => {
            taskMap[task.taskId] = { ...task, children: [] };
        });

        // Process task dependencies
        tasks.forEach(task => {
            // Handle prev, nextOnSuccess, and nextOnFailure as lists or null
            if (task.prev && Array.isArray(task.prev)) {
                task.prev.forEach(prevTaskId => {
                    if (taskMap[prevTaskId]) {
                        taskMap[prevTaskId].children.push(taskMap[task.taskId]);
                    }
                });
            }

            if (task.nextOnSuccess && Array.isArray(task.nextOnSuccess)) {
                task.nextOnSuccess.forEach(nextTaskId => {
                    if (taskMap[nextTaskId]) {
                        taskMap[task.taskId].children.push(taskMap[nextTaskId]);
                    }
                });
            }

            if (task.nextOnFailure && Array.isArray(task.nextOnFailure)) {
                task.nextOnFailure.forEach(nextTaskId => {
                    if (taskMap[nextTaskId]) {
                        taskMap[task.taskId].children.push(taskMap[nextTaskId]);
                    }
                });
            }
        });

        // Find the root task (no prev task)
        const rootTask = tasks.find(task => !task.prev || task.prev.length === 0);
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
            .attr("fill", "black");

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
                .attr("width", d => Math.max(120, d.data.name.length * 8))
                .attr("height", d => Math.max(60, 20 + d.data.name.split(" ").length * 20))
                .attr("fill", "transparent")
                .attr("stroke", d => getNodeColor(d))
                .attr("stroke-width", 2)
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
                .attr("fill", "#ddd")
                .style("white-space", "pre-wrap")
                .style("word-wrap", "break-word");

            const nodeUpdate = nodeEnter.merge(node);

            nodeUpdate.transition()
                .duration(200)
                .attr("transform", d => `translate(${d.y},${d.x})`);

            nodeUpdate.select("rect")
                .attr("width", d => Math.max(120, d.data.name.length * 8))
                .attr("height", d => Math.max(60, 20 + d.data.name.split(" ").length * 20));

            nodeUpdate.select("text").attr("dx", 10).attr("dy", 40);

            node.exit().transition()
                .duration(200)
                .attr("transform", d => `translate(${source.y},${source.x})`)
                .remove();

            const link = svg.selectAll("path.link")
                .data(links, d => d.target.data.taskId);

            link.enter().insert("path", "g")
                .attr("class", d => `link ${getArrowColor(d)}`)
                .attr("d", d => {
                    const o = { x: source.x0, y: source.y0 };
                    return diagonal({ source: o, target: o });
                })
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
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else {
                    d.children = d._children;
                    d._children = null;
                }
                update(d);
            }
        }

        function diagonal(d) {
            const sourceX = d.source.y + 50;
            const sourceY = d.source.x + 25;
            const targetX = d.target.y + 50;
            const targetY = d.target.x + 25;

            const sourceRectWidth = Math.max(120, d.source.data.name.length * 8);
            const sourceRectHeight = Math.max(60, 20 + d.source.data.name.split(" ").length * 20);
            const targetRectWidth = Math.max(120, d.target.data.name.length * 8);
            const targetRectHeight = Math.max(60, 20 + d.target.data.name.split(" ").length * 20);

            let sourceMidX = sourceX + sourceRectWidth / 2;
            let sourceMidY = sourceY + sourceRectHeight / 2;

            let targetMidX = targetX + targetRectWidth / 2;
            let targetMidY = targetY + targetRectHeight / 2;

            if (d.source.y < d.target.y) {
                sourceMidY = sourceY + sourceRectHeight;
                targetMidY = targetY;
            } else if (d.source.y > d.target.y) {
                sourceMidY = sourceY;
                targetMidY = targetY + targetRectHeight;
            } else if (d.source.x < d.target.x) {
                sourceMidX = sourceX + sourceRectWidth;
                targetMidX = targetX;
            } else if (d.source.x > d.target.x) {
                sourceMidX = sourceX;
                targetMidX = targetX + targetRectWidth;
            }

            return `M${sourceMidX},${sourceMidY}
                    C${sourceMidX},${(sourceMidY + targetMidY) / 2}
                    ${targetMidX},${(sourceMidY + targetMidY) / 2}
                    ${targetMidX},${targetMidY}`;
        }

        function getArrowColor(d) {
            if (d.source.data.type === "Success") return "green";
            if (d.source.data.type === "Failure") return "red";
            return "black";
        }

        function getNodeColor(d) {
            if (d.data.type === "Success") return "green";
            if (d.data.type === "Failure") return "red";
            return "black";
        }
    }

    // Export workflow data as JSON
    function exportWorkflow() {
        const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "workflow.json";
        link.click();
    }

    // Download the rendered graph as an SVG
    function downloadGraph() {
        const svgElement = document.querySelector("svg");
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "graph.svg";
        link.click();
        URL.revokeObjectURL(url);
    }

    // Copy workflow JSON to clipboard
    function copyWorkflowJson() {
        navigator.clipboard.writeText(JSON.stringify(workflowData, null, 2))
            .then(() => {
                console.log("Workflow JSON copied to clipboard");
            })
            .catch(err => {
                console.error("Error copying to clipboard: ", err);
            });
    }

    // Event listeners
    document.getElementById("jsonFileInput").addEventListener("change", handleFileUpload);
    document.getElementById("exportButton").addEventListener("click", exportWorkflow);
    document.getElementById("downloadGraphButton").addEventListener("click", downloadGraph);
    document.getElementById("copyJsonButton").addEventListener("click", copyWorkflowJson);
});
