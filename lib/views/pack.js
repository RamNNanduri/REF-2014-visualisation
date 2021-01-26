/*-------------------------------------------------------------------- 
  
   Module: pack layout
   Author: Mike Chantler
   Modified by: Ram Nanduri
  
   What it does:
  	pack layout

   Dependencies
  	D3.js v4
  
---------------------------------------------------------------------- */
var hierarchyGraph; //The graph of objects used to represent the hierarchy

function pack(targetDOMelement) { 
	
	var packObject = {};

	//=================== PUBLIC FUNCTIONS =========================
	//

	packObject.addCSSClassesToDOMelements = function (selectors, cssClassName, trueFalse) {
		//Method to add the class <cssClassName> to all DOM elements that have at least one of the
		// selectors (e.g. classes) contained in the array <selectors>
		// (allows easy highlighting of multiple nodes)
		//
		//Selectors is an array of css selectors (e.g. .class and #id),
		//an example of cssClassName would be: "highlight", and
		//trueFalse must either be true (set the cssClassName) or false (remove the cssClassName)
		
		selectors.forEach(s => grp.selectAll(s).classed(cssClassName, trueFalse))
		return packObject; //for method chaining
	}
		
	packObject.loadAndRenderNestDataset = function (nestFormatHierarchy, rootName) {
		//Loads and renders (format 2) hierarchy in "nest" or "key-values" format.
		layoutAndRenderHierarchyInNestFormat(nestFormatHierarchy, rootName)
		return packObject; //for method chaining
	}	

	
	packObject.nodeLabelIfNoKey = function (fn) {
		//Leaf nodes from d3.nest typically have no 'key' property
		//By default the d3.nest 'key' property is used as the node text label
		//If this does not exist the nodeLabelIfNoKey() function will be called to 
		// provide the label
		nodeLabelIfNoKey = fn;
		return packObject; //for method chaining
	}
	
	packObject.appendClickFunction = function (fn) {
		appendClickFunction = fn;
		return packObject;
	}
	//=================== PRIVATE VARIABLES ====================================
	
	//Declare and append SVG element
	var margin = {top: 20, right: 200, bottom: 20, left: 50},
	width = 800 - margin.right - margin.left,
	height = 500 - margin.top - margin.bottom;

	//Set up SVG and append group to act as container for pack graph
	var grp = d3.select(targetDOMelement).append("svg")
		.attr("width", width + margin.right + margin.left)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
	//Add group for the nodes, just for clarity when 'inspecting' the html & svg
	var nodesGroup = grp
		.append("g")
		.classed("nodesGroup", true);
		
	//Add group for the links, just for clarity when 'inspecting' the html & svg
	var linksGroup = grp
		.append("g")
		.classed("linksGroup", true);
 


	//=================== PRIVATE FUNCTIONS ====================================
	var nodeLabelIfNoKey = function(){return ""};
	var appendClickFunction = function(){console.log ("No click fn appended")};
	var clickFunction = function (clickedNode,i){

		if (clickedNode.children) {
			hideChildren(clickedNode)
		}
		else {
			//Reveal children
			revealChildren(clickedNode);
			
			//Store the position of the clicked node 
			//so that we can use it as the starting position 
			//for the revealed children in the GUP Node Enter Selection
			clickedNode.xAtEndPreviousGUPrun = clickedNode.x; 
			clickedNode.yAtEndPreviousGUPrun = clickedNode.y;	
		}
		
		//Now calculate new x,y positions for all visible nodes and render in GUP
		calculateXYpositionsAndRender(hierarchyGraph, clickedNode);
		
		//Now do anything else (e.g. interactions as specified in the pbulic 
		//method appendClickFunction()
		appendClickFunction(clickedNode,i );
	}

	function hideChildren(node) {
		if (node.children) { 
			node._children = node.children;
			node.children = null;
		} 
	}
	
	function revealChildren(node) {
		if (node._children) { 		
			node.children = node._children;
			node._children = null;
		}
	}
	
	function hideUnhideChildren(d) {
		var clickedNode = d;
		if (clickedNode.children) { 
			//Hide children
			clickedNode._children = d.children;
			clickedNode.children = null;

		} else {
			//Reveal children
			clickedNode.children = clickedNode._children;
			clickedNode._children = null;
			clickedNode.xAtEndPreviousGUPrun = clickedNode.x; 
			clickedNode.yAtEndPreviousGUPrun = clickedNode.y;		}
	}


	nodeLabel = function(d) {
		if (d.data.key) return d.data.key + "(value:"+ d.value+")";
		else return nodeLabelIfNoKey(d);
	}
	
	
	function layoutAndRenderHierarchyInNestFormat (nestFormatHierarchy, rootName){
	//Lays out and renders (format 2) hierarchy in "nest" ("key-values" format).
	
		//Move the 'nest' array into a root node:
		var datasetAsJsonD3Hierarchy = {"key":rootName, "values": nestFormatHierarchy}

		//Now create hierarchy structure 
		//Note that we need to add the "children" accessor "d=>d.values" in order
		//to tell d3.hierarchy to use nest's 'values' as children
		hierarchyGraph = d3
			.hierarchy(datasetAsJsonD3Hierarchy, d=>d.values) 
			//NB NB below is required for d3.pack etc that use a size attribute (e.g. for the different sizes of circles in d3.pack)
			 .sum(d=>{
			 	console.log(d);
			 	if(d.value){return d.value.length;}
			 	else return 0;}); //accessor for size data (e.g. circle size in a d3.pack)
			//                 //However, it's usually not required for pack (this adds the sum of all descendants' sizes and stores in node.value) 
			// .sort(function(a, b) { return b.tip - a.tip; });

			//And we'll use the nest 'keys' as the node labels
		nodeLabel = function(d) {
		if (d.data.key) return d.data.key;
		else return nodeLabelIfNoKey(d);
	}
			
		//And perform layout
		addpackXYdataAndRender(hierarchyGraph);
	}

	function addpackXYdataAndRender(hierarchyGraph){
		
		var rootNode = hierarchyGraph;

		//Set 'clicked node' node to root of hierarchy to start
		//as we want all nodes to appear from the root on startup
		clickedNode = rootNode;

		//And set it's 'previous' position to (0,0) as we'll 
		//start drawing from there
		clickedNode.xAtEndPreviousGUPrun=clickedNode.yAtEndPreviousGUPrun=0;

		//Now we'll hide all nodes except the root and the next level down 
		//to dreate a compact pack to start the dashboard
		rootNode.descendants().forEach(node => {if(node.depth - 0) hideChildren(node)})

		//Add (x,y) positions of all visible nodes and render
		calculateXYpositionsAndRender(hierarchyGraph, clickedNode);

	}
	
	function calculateXYpositionsAndRender(hierarchyGraph, clickedNode){
		//Note that the 'clickedNode' is the clicked node in a collapse or
		//uncollapse animation
		//For a colapse, we want all children of the clicked node converge upon the
		//the clicked node's final position (in the current GUP animation) and then exit.
		
		//get and setup the pack layout generator 
		var mypackLayoutGenerator = d3.pack().size([height, width]);

		//Add the newly calculated x and y properies to each node
		//in the hierarcy graph.
		var hierarchyGraphWithPositions = mypackLayoutGenerator(hierarchyGraph);

		//Get lists of nodes and links
		var listOfLinksByDescendants = hierarchyGraphWithPositions.descendants().slice(1);
		listOfNodes = hierarchyGraphWithPositions.descendants();
		console.log("listOfNodes",listOfNodes)											 //Note that the x,y values are the 
													//final positions we want for the graph
													//i.e. values after transitions

		//Render links and nodes
		//GUPrenderLinks(listOfLinksByDescendants, clickedNode);
		GUPrenderNodes(listOfNodes, clickedNode);		

	}


	function GUPrenderNodes(listOfNodes, clickedNode){
		
		//DATA BIND
		var selectionGroup = nodesGroup
			.selectAll("g.cssClassNode") //select groups with class = "cssClassNode"
			.data(listOfNodes, generateUniqueKey);		

		//ENTER  SELECTION PROCESSING
		
		//Create groups
		var enterSelectionGroup = selectionGroup
			.enter()
			.append("g")
			.attr("class", d=>{if(d.data.key) return "nest-key--"+d.data.key.replace(/[\W]+/g,"_"); else return "No key";})
			.classed("cssClassNode enterSelection", true)
			.on("click", clickFunction)

		//transitions
		enterSelectionGroup	
			.attr("transform", function(d) { 
				
				return "translate(" + clickedNode.yAtEndPreviousGUPrun + "," + clickedNode.xAtEndPreviousGUPrun + ")"; 
			})
			//Transition to final entry positions
			.transition()
			.duration(2000)
			.attr("transform", function(d) { 
				return "translate(" + d.y + "," + d.x + ")"; 
			});	
			
		//Append nodes to group
		enterSelectionGroup
			.append("circle")
			.attr("r", function (d){console.log("d=",d); return d.r;} );
			
		//Append text to group
		enterSelectionGroup
			.append("text")

		//Append tooltip title to group
		enterSelectionGroup
			.append("title")
			.text(nodeLabel)
			
		
		//Merged ENTER + UPDATE group selections
		enterUpdateSelectionGroup = enterSelectionGroup
			.merge(selectionGroup)
			
		enterUpdateSelectionGroup
			//translate the group into the correct position 
			.attr("transform", function(d) { 
				return "translate(" + d.y + "," + d.x + ")"; 
			})
			
		enterUpdateSelectionGroup
			//set appropriate classes for the group
			.classed("leafNode", d => d.height == 0)
			.classed("rootNode", d => d.depth == 0)
			.classed("intermediateNode", d => (d.height != 0 && d.depth != 0));
		
		//Create Merged ENTER + UPDATE selections for the text element in the group
		enterUpdateSelectionText = 	enterUpdateSelectionGroup
			//add text to the text element
			.select("text")
			.text(nodeLabel);
			
		//UPDATE 
		selectionGroup
			.classed("enterSelection", false)
			.classed("updateSelection", true)
			.transition()
			.duration(2000)
			.attr("transform", function(d) { 
				return "translate(" + d.y + "," + d.x + ")"; 
			})
			.select("circle")
			.attr("r", d => d.r);

		// EXIT 
		selectionGroup
			.exit()
			.classed("enterSelection updateSelection", false)
			.classed("exitSelection", true)
			//Move departing nodes to clicked node and remove.
			.transition()
			.duration(2000)
			.attr("transform", function(d) {
				d.x =  clickedNode.x; 
				d.y =  clickedNode.y;
				return "translate(" + d.y + "," + d.x + ")";
			})
			.remove();
	}

	//Define key generator
	var lastKey=0;
	function generateUniqueKey(d) {
		//If no key then generate new unique key, assign it, and return to caller 
		if(!d.hasOwnProperty("key")) d.key = ++lastKey;
		return d.key;
	}

	//================== IMPORTANT do not delete ==================================
	return packObject; // return the main object to the caller to create an instance of the 'class'
	
} //End of pack() declaration	