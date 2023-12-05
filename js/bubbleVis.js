class BubbleVis {

    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.arrangedData = [];
        this.selection = "2016-2020";
        this.lowYear = +this.selection.slice(0,4);
        this.highYear = +this.selection.slice(5,9);

        this.initVis();
    }


    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 80, bottom: 40, left: 40};

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 550 - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`); // + vis.margin.left.toString() + "," + vis.margin.top.toString() - 50 + ")");

        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'chordTooltip');

        vis.areaScale = d3.scaleSqrt()
            .range([4, 30])

        vis.colorScale = d3.scaleLinear()
            .range(['#d0dba3','#90a540'])

        // Title for Bubble Visualization and Histogram
        vis.svg.append("text")
            .attr("x", vis.width / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("font-size", 30)
            .text("Selected Musical Data from Top 2000 Hits (by Streams) Between 1998 and 2020")

        // Subtitle for Bubble Visualization
        vis.svg.append("text")
            .attr("x", vis.width / 2)
            .attr("y", 70)
            .attr("text-anchor", "middle")
            .attr("font-size", 24)
            .text("Number of Hits by Top Artists by Year")

        vis.svg.append("text")
            .attr("x", vis.width)
            .attr("y", 200)
            .attr("text-anchor", "end")
            .attr("font-size",17)
            .attr("color", "#C5D86D")
            .attr("id", "directions")
            .text("Hover over a bubble to find out top artists and their hit count!")

        vis.svg.append("text")
            .attr("x", 20)
            .attr("y", 200)
            .attr("font-size",18)
            .text("Using data collected on the most popular songs")

        vis.svg.append("text")
            .attr("x", 20)
            .attr("y", 220)
            .attr("font-size",18)
            .text("on Spotify released from 1998 to 2020, we can select")

        vis.svg.append("text")
            .attr("x", 20)
            .attr("y", 240)
            .attr("font-size",18)
            .text("any range of years and see which artists have had the")

        vis.svg.append("text")
            .attr("x", 20)
            .attr("y", 260)
            .attr("font-size",18)
            .text("most (and the least) hits in that time span.")

        vis.svg.append("text")
            .attr("x", 20)
            .attr("y", 280)
            .attr("font-size",18)
            .text("The larger the bubble, the higher the number of hits!")

        vis.svg.append("text")
            .attr("x", vis.width - vis.margin.right + 50)
            .attr("y", 420)
            .attr("font-size",16)
            .attr("text-anchor", 'end')
            .text("Notice how in each of these timespans,")
        vis.svg.append("text")
            .attr("x", vis.width - vis.margin.right + 50)
            .attr("y", 440)
            .attr("font-size",16)
            .attr("text-anchor", 'end')
            .text("different artists become giants in the music")
        vis.svg.append("text")
            .attr("x", vis.width - vis.margin.right + 50)
            .attr("y", 460)
            .attr("font-size",16)
            .attr("text-anchor", 'end')
            .text("industry (the darkest circles) before being replaced")
        vis.svg.append("text")
            .attr("x", vis.width - vis.margin.right + 50)
            .attr("y", 480)
            .attr("font-size",16)
            .attr("text-anchor", 'end')
            .text("by new stars in the next timespan, demonstrating the")
        vis.svg.append("text")
            .attr("x", vis.width - vis.margin.right + 50)
            .attr("y", 500)
            .attr("font-size",16)
            .attr("text-anchor", 'end')
            .text("ever-changing nature of musical trends and public taste.")
        vis.wrangleData()
    }

    wrangleData() {
        let vis = this;

        vis.arrangedData = [];

        vis.lowYear = +vis.selection.slice(0,4);
        vis.highYear = +vis.selection.slice(5,9);


        let countingDict = {};
        vis.data.forEach(d => {
            if (d.year >= vis.lowYear && d.year <= vis.highYear) {
                if (d.artist in countingDict) {
                    countingDict[d.artist] += 1;
                }
                else {
                    countingDict[d.artist] = 1;
                }
            }
        });

        for (const indivArtist in countingDict) {
            vis.arrangedData.push({
                artist: indivArtist,
                count: countingDict[indivArtist]
            })
        }

        console.log("Bubble vis data", vis.arrangedData)
        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.minCount = d3.min(vis.arrangedData, d => d.count);
        vis.maxCount = d3.max(vis.arrangedData, d => d.count);
        vis.areaScale.domain([vis.minCount, vis.maxCount]);
        vis.colorScale.domain([vis.minCount, vis.maxCount]);
        let numNodes = vis.arrangedData.length;
        // console.log("numnodes")
        // console.log(numNodes)
        vis.nodes = d3.range(numNodes).map(function(d, i) {
            return {radius: vis.areaScale(vis.arrangedData[i].count), artist: vis.arrangedData[i].artist, count: vis.arrangedData[i].count}
        })


        let tickCount = 0;
        vis.simulation = d3.forceSimulation(vis.nodes)
            .force('charge', d3.forceManyBody().strength(5))
            .force('center', d3.forceCenter(vis.width / 2, vis.height / 2 + 100))
            .force('collision', d3.forceCollide().radius(function(d) {
                return d.radius + 2
            }))
            .on('tick', ticked)


        function ticked() {
            vis.svg.selectAll("circle").remove();

            vis.svg.selectAll('circle')
                .data(vis.nodes)
                .enter()
                .append('circle')
                .attr('r', function(d) {
                    return d.radius
                })
                .attr('cx', function(d) {
                    return d.x
                })
                .attr('cy', function(d) {
                    return d.y
                })
                .attr('fill', d => vis.colorScale(d.count))
                .on('mouseover', function(event, d){
                    let i = tickCount;
                    tickCount += 1;
                    d3.select(this)
                        .attr('stroke-width', '1px')
                        .attr('stroke', 'white')
                        .attr('fill', '#e2ecb6');

                    vis.tooltip
                        .style("fill", "white")
                        .style("opacity", 1)
                        .style("left", event.pageX + 20 + "px")
                        .style("top", event.pageY + "px")
                        .html(`
                         <div style="border: thin solid grey; border-radius: 5px; background: #f7e4f7; padding: 5px; height: 50px">
                             <h6 class="bubbleToolTipInfo">${d.artist}</h6>
                             <p class="bubbleToolTipInfo">Count: ${d.count}</p>                      
                         </div>`);
                })
                .on('mouseout', function(event, d){
                    d3.select(this)
                        .attr("fill", "#C5D86D")
                        .style("stroke", "#C5D86D")
                        .attr("stroke-width", 0.25)

                    vis.tooltip
                        .style("opacity", 0)
                        .style("left", 0)
                        .style("top", 0)
                        .html(``);
                })
        }
    }
}

