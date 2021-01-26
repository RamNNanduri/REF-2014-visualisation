
"use safe"

function scatterplot(targetDOMelement) { 

	var scatterplotObject = {};
	
	//=================== PUBLIC FUNCTIONS =========================
	//
	scatterplotObject.appendedMouseOverFunction = function (callbackFunction) {
		console.log("appendedMouseOverFunction called", callbackFunction)
		appendedMouseOverFunction = callbackFunction;
		render();
		return scatterplotObject;
	}	
	
	scatterplotObject.appendedMouseOutFunction = function (callbackFunction) {
		appendedMouseOutFunction = callbackFunction;
		render();
		return scatterplotObject;
	}

	scatterplotObject.loadAndRenderDataset = function (data) {
		dataset=data.map(d=>d); //create local copy of references so that we can sort etc.
		render();
		return scatterplotObject;
	}			
	scatterplotObject.render = function (data) {
		GUP_dots(dataset);
		//console.log("render called",targetDOM)
		return scatterplotObject;
	}	
	scatterplotObject.overrideMouseoverFunction = function (callbackFunction) {
		mouseoverCallback = callbackFunction;
		return scatterplotObject;
	}
	scatterplotObject.overrideMouseoutFunction = function (callbackFunction) {
		mouseoutCallback = callbackFunction;
		return scatterplotObject;
	}

	scatterplotObject.overrideDataFieldFunction = function(dataFieldFunction) {
		dataField = dataFieldFunction;
		return scatterplotObject;
	}

	scatterplotObject.overrideDf2Function = function(df2Function) {
		df2 = df2Function;
		return scatterplotObject;
	}

	scatterplotObject.maxValueOfDataField = function (max) {
		maxValueOfDataset = max;
		maxValueOfDataField=function(){return maxValueOfDataset};
		return scatterplotObject;
	}	

	scatterplotObject.maxValueOfDf2 = function (max2) {
		maxValueOfDataset2 = max2;
		maxValueOfDataField=function(){return maxValueOfDataset};
		return scatterplotObject;
	}	

	 scatterplotObject.overrideTooltipFunction = function (toolTipFunction) {
        toolTip = toolTipFunction;
        return scatterplotObject;
    }

    scatterplotObject.appendClickFunction = function (fn) {
		appendClickFunction = fn;
		return scatterplotObject;
	}
	
	//=================== PRIVATE VARIABLES ====================================
	//Width and height of svg canvas
	var svgWidth = 700; 
	var svgHeight = 700;
	var dataset = [];
	var targetDOM = targetDOMelement;
	var xScale = d3.scaleLinear();
	var yScale = d3.scaleLinear();
	var maxValueOfDataset;
	var maxValueOfDataset2;
	var yAxisIndent = 50;
	var xAxisIndent = 50; //Space for labels
	var toolTip = function(d){return  d.key + ": "+ d.datafield}

	//=================== INITIALISATION CODE ====================================
	
	//Declare and append SVG element
	var svg = d3
		.select(targetDOM)
		.append("svg")
		.attr("width", svgWidth)
		.attr("height", svgHeight)
		.classed("scatterplot",true);			

	var yAxis = svg
		.append("g")
		.classed("yAxis", true);	
		
	//Declare and add group for x axis
	var xAxis = svg
		.append("g")
		.classed("xAxis", true);			
		
	//===================== PRIVATE FUNCTIONS =========================================
	
	var dataField = function(d){return d.dataField} //The length of the bars
	var df2 = function(d){return d.df2;}
	var getBarPosition = function(d, i){return 24* i;}
	var getKey = function(d){return d.keyField;}

	var appendedMouseOutFunction = function(){};
		
	var appendedMouseOverFunction = function(){};

	var appendClickFunction = function(){console.log ("No click fn appended")};

	var clickFunction = function (d,i){
		console.log("node clicked, d = ",d);
		appendClickFunction (d,i);
	}

	var mouseOverFunction = function (d,i){
        d3.select(this).classed("highlight", true).classed("noHighlight", false);
		appendedMouseOverFunction(d,i);
	}
	
	var mouseOutFunction = function (d,i){
        d3.select(this).classed("highlight", false).classed("noHighlight", true);
		appendedMouseOutFunction(d,i);
	}	

	var xAxisLabel = function (){ return "X - Axis";};

	var yAxisLabel = function (){ return "Y - Axis";};


	var maxValueOfDataField = function(){

		return d3.max(dataset, dataField)
	};	

	var maxValueOfDf2 = function(){

		return d3.max(dataset, df2)
	};	

	function render () {
		updateScalesAndRenderAxes();
		GUP_dots();
	}

	function updateScalesAndRenderAxes(){
		//Set scales to reflect any change in svgWidth, svgHeight or the dataset size or max value
		xScale
			.domain([0, maxValueOfDataField()])
			.range([0, svgWidth-(yAxisIndent + 10)]);
		yScale
			.domain([0, maxValueOfDf2()]) 
			.range([0, svgHeight-(xAxisIndent + 10)]);
			
		//Now render the y-axis using the new yScale
		var yAxisGenerator = d3.axisLeft(yScale);
		svg.select(".yAxis")
			.transition().duration(1000).delay(1000)
			.attr("transform", "translate(" + yAxisIndent + "," + xAxisIndent +")" )
			.call(yAxisGenerator);	

		//Now render the x-axis using the new xScale
		var xAxisGenerator = d3.axisTop(xScale);
		svg.select(".xAxis")
			.transition().duration(1000).delay(1000)
			.attr("transform", "translate(" + yAxisIndent + "," + xAxisIndent + ")" )
			.call(xAxisGenerator);
	};

	var GUP_dots = function(){
		//GUP = General Update Pattern to render bars 
		
		//GUP: SELECT & BIND
		selection = svg
			.selectAll(".dot")
			.data(dataset, getKey);			

		//GUP: ENTER SELECTION
		var enterSelection = selection
			.enter()
			//.append("rect")
			.append("circle")
			.attr("class","dot")
			.attr("r", 4)
		    .attr("cx", function (d){ return xScale(dataField(d)) + yAxisIndent;})
		    .attr("cy", function (d){ return yScale(df2(d)) + xAxisIndent;})
		    .classed("highlight", d=>d.highlight)
			.classed("enterSelection", true);

		enterSelection //Add tooltip
            .append("title")
                .text(toolTip)
		
		//GUP UPDATE SELECTION
		var updateSelection = selection
			.classed("enterSelection", false)
			.classed("updateSelection", true)
			.attr("cx", function (d){ return xScale(dataField(d)) + yAxisIndent;})
		    .attr("cy", function (d){ return yScale(df2(d))+ xAxisIndent;});

		updateSelection //update tool tip
            .select("title") //Note that we already created a <title></title> in the Enter selection
                .text(toolTip)

        var mergedSelection = enterSelection.merge(selection)
            .on("mouseover", mouseOverFunction)
            .on("mouseout", mouseOutFunction)
            .on("click", clickFunction)
		
		//GUP EXIT SELECTION 
		selection.exit()
			.classed("enterSelection updateSelection", false)
			.classed("exitSelection", true)
			.remove() 
	}
		
	
	//================== IMPORTANT do not delete ==================================
	return scatterplotObject; // return the main object to the caller to create an instance of the 'class'
	
} //End of scatterplot() declaration	

