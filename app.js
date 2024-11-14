document.addEventListener('DOMContentLoaded', function () {
    const graphContainer = document.getElementById('graph');
    const componentPanel = document.getElementById('componentPanel');
    const exportButton = document.getElementById('exportButton');
    const downloadGraphButton = document.getElementById('downloadGraphButton');
    const copyJsonButton = document.getElementById('copyJsonButton');
    const jsonFileInput = document.getElementById('jsonFileInput');
    let graphData = [];

    // Utility function to load JSON data
    function loadJSONData(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                graphData = JSON.parse(e.target.result);
                renderGraph(graphData);
            } catch (err) {
                alert('Invalid JSON format');
            }
        };
        reader.readAsText(file);
    }

    jsonFileInput.addEventListener('change', (event) => {
        loadJSONData(event.target.files[0]);
    });

    // Render graph function
    function renderGraph(data) {
        if (!data || !data.workflowTasks || data.workflowTasks.length === 0) {
            alert("Invalid workflow data");
            return;
        }

        // Clear previous graph
        graphContainer.innerHTML = '';
        
        // Set up SVG container
        const width = 1200;
        const height = 600;
        const svg = d3.select(graphContainer)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('border', '1px solid #ccc');

        // Define the colors for each component type
        const componentColors = {
            "START": "#4CAF50", // green
            "TASK": "#2196F3", // blue
            "END": "#FF5733" // red
        };

        // Initialize task nodes and links
        const nodes = [];
        const links = [];

        // Create nodes and links from tasks
        data.workflowTasks.forEach(task => {
            const taskNode = {
                id: task.taskId,
                type: task.type,
                name: task.name,
                prev: task.prev,
                nextOnSuccess: task.nextOnSuccess,
                nextOnFailure: task.nextOnFailure,
            };
            nodes.push(taskNode);

            // Create links for nextOnSuccess and nextOnFailure
            if (task.nextOnSuccess) {
                task.nextOnSuccess.forEach(successTaskId => {
                    links.push({ source: task.taskId, target: successTaskId, type: 'success' });
                });
            }
            if (task.nextOnFailure) {
                task.nextOnFailure.forEach(failureTaskId => {
                    links.push({ source: task.taskId, target: failureTaskId, type: 'failure' });
                });
            }
        });

        // Create a color scale for the task nodes
        const colorScale = d3.scaleOrdinal()
            .domain(["START", "TASK", "END"])
            .range([componentColors["START"], componentColors["TASK"], componentColors["END"]]);

        // Create node positions
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(150))
            .force('charge', d3.forceManyBody().strength(-100))
            .force('center', d3.forceCenter(width / 2, height / 2));

        // Create links (arrows) for success and failure
        const link = svg.append('g')
            .selectAll('.link')
            .data(links)
            .enter()
            .append('line')
            .attr('class', 'link')
            .attr('stroke', d => d.type === 'success' ? 'green' : 'red')
            .attr('stroke-width', 2);

        // Create nodes (task components)
        const node = svg.append('g')
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'node');

        // Create task rectangles
        node.append('rect')
            .attr('x', -50)
            .attr('y', -25)
            .attr('width', 100)
            .attr('height', 50)
            .attr('rx', 10)
            .attr('ry', 10)
            .attr('fill', d => colorScale(d.type));

        // Add text inside the rectangles for task type
        node.append('text')
            .attr('class', 'taskType')
            .attr('x', 0)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .text(d => d.type);

        // Add task name under the type
        node.append('text')
            .attr('class', 'taskName')
            .attr('x', 0)
            .attr('y', 15)
            .attr('text-anchor', 'middle')
            .text(d => d.name);

        // Update the simulation
        simulation.on('tick', () => {
            node.attr('transform', d => `translate(${d.x},${d.y})`);
            link.attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
        });
    }

    // Export and download buttons functionality
    exportButton.addEventListener('click', () => {
        if (graphData && graphData.workflowTasks) {
            const dataStr = JSON.stringify(graphData, null, 2);
            const dataUri = 'data:text/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const exportAnchor = document.createElement('a');
            exportAnchor.setAttribute('href', dataUri);
            exportAnchor.setAttribute('download', 'workflow.json');
            exportAnchor.click();
        } else {
            alert('No workflow data available for export.');
        }
    });

    downloadGraphButton.addEventListener('click', () => {
        const svg = document.querySelector('svg');
        const svgData = svg.outerHTML;
        const dataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataUri);
        downloadAnchor.setAttribute('download', 'workflow.svg');
        downloadAnchor.click();
    });

    copyJsonButton.addEventListener('click', () => {
        if (graphData && graphData.workflowTasks) {
            const dataStr = JSON.stringify(graphData, null, 2);
            navigator.clipboard.writeText(dataStr).then(() => {
                alert('Workflow JSON copied to clipboard!');
            });
        } else {
            alert('No workflow data available to copy.');
        }
    });
});
