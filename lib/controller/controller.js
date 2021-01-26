/*-------------------------------------------------------------------- 
  
   Module: Controller
   Author: Ram Nanduri
  
   What it does:
  	Controller
  
   Dependencies
  	D3.js v4
 
---------------------------------------------------------------------- */
function DoR(){

	d3.selectAll("#packDiv,#bcDiv,#spDiv").select("svg").remove();

	document.getElementById("descDiv1").textContent = "Select a University within a UoA from the layout below:  ";
	
	document.getElementById("descDiv2").textContent = "The topic weights for the selection are:";

	document.getElementById("descDiv3").textContent = "4* vs Word count for the selection: X-Axis - Environment 4*, Y-Axis - Word count";

	var dm1 = modelConstructor();  //Create datamodel object (gives access to methods in ref14model.js etc )
	var dataModel; //shorthand for dm1.model() and declared as nasty outer block variable for easy access from console.
	var pack1;
	var bc;
	var sp; 
	

	//=============== READ DATA FILES ================================


	d3.queue()
		.defer(d3.csv, "data/topics/REF2014T30TopicOrder.csv")
		.defer(d3.csv, "data/290183_REF_Contextual_table_1314_0.csv")
		.defer(d3.csv, "data/learning-providers-plus.csv")
		.defer(d3.json, "data/topics/REF2014T30Python.json")
		.defer(d3.csv, "data/REF2014_Results.csv")
		.await(initialiseApp)

	//======================== MAIN FUNCTION =================================
	//Carries out all initialization and setup
	function initialiseApp(error, ref14data, ref14context , learningProviders, jsonTopicData, REF2014_Results){
		//Check data files have loaded
		if (error) {console . log (" there are errror with loading the data: ", error); return;}
		
		//Create data model 
		dm1.loadData(ref14data, ref14context , learningProviders, jsonTopicData, REF2014_Results);	
		dataModel = dm1.model()
		
		//Layout and render flat data as pack
		var nest = d3.nest()
			.key(refEntry => refEntry.UoAString)
				 .sortKeys(d3.ascending)
			.key(refEntry => refEntry["Institution name"])
				 .sortKeys(d3.ascending)
			.rollup(values => values) //add rollup to campact leaves and store refEntry info
			.entries(dataModel.refEntries); 
		
		pack1 = pack("#packDiv")
		 .appendClickFunction(packClickFunction)
			.loadAndRenderNestDataset(nest, "REF2014")

		bc = barchart("#bcDiv")
			.overrideDataFieldFunction(e=>e.weight)
			.overrideKeyFunction(e=>e.topicAs3words)
			.overrideTooltipFunction(e=> {return e.topicAs3words + ", weight = " + e.weight});
			
		sp = scatterplot("#spDiv")
			.overrideDataFieldFunction(e => Number(e.environment["4*"]))
			.overrideDf2Function(e => Number(e.environment["WordCount"]))
			.overrideTooltipFunction(e=>{return e["Institution name"] + ", " +e.lp.TOWN + ", UoA : " + e.UoAString;})
			.appendedMouseOverFunction(highlightPackNodesWithThis)
			.appendedMouseOutFunction(removeHighlighting)
			.appendClickFunction(spClickFunction)
			.loadAndRenderDataset(dataModel.refEntries);

	}

			function spClickFunction (d){
				var clicked4Star = d.environment["4*"];
				var clickedWordCount = d.environment["WordCount"];

				var refEntriesWithThis = dataModel.refEntries.filter(e => e.environment["4*"] == clicked4Star);
						var bcData =refEntriesWithThis[0].environment.topicsAsArray.sort(function(a,b){return b.weight-a.weight;}).slice(0,20);
				bc.loadAndRenderDataset(bcData);
			}
			
			var institutionClassesToHighlight;

			function highlightPackNodesWithThis(d){
				var clicked4Star = d.environment["4*"];
				var clickedWordCount = d.environment["WordCount"];

				var refEntriesWithThis = dataModel.refEntries.filter(e => e.environment["4*"] == clicked4Star).filter(e => e.environment["WordCount"]==clickedWordCount);
				institutionClassesToHighlight = refEntriesWithThis
													.map(function(e){
													 return ".nest-key--"+ e["Institution name"].replace(/[\W]+/g,"_");
													});

				pack1.addCSSClassesToDOMelements(institutionClassesToHighlight, "highlight", true);

				console.log(institutionClassesToHighlight);
				
			}
		
			function removeHighlighting (d){
				 pack1.addCSSClassesToDOMelements(institutionClassesToHighlight, "highlight", false);
			}

			function packClickFunction(d,i){
				if(d.height==0){
					console.log("pack click, d.height, d = ", d.data.key)
				var uni = d.data.key;
				var uoaString = d.parent.data.key;

				var b = dataModel.refEntries.filter(e=>e["Institution name"] == uni).filter(e=>e["UoAString"] == uoaString);

				var bcData = b[0].environment.topicsAsArray.sort(function(a,b){return b.weight-a.weight;}).slice(0,20);
				bc.loadAndRenderDataset(bcData);

				sp.loadAndRenderDataset(b);

				}

				if(d.height==1){

				var uoaString2 = d.data.key

				var bcData2 = dataModel.refEntries.filter(e=>e["UoAString"] == uoaString2);

						
						bc.loadAndRenderDataset(bcData2[0].environment.topicsAsArray.sort(function(a,b){return b.weight-a.weight;}).slice(0,20));

						sp.loadAndRenderDataset(bcData2);
				}
			}
			
}

function IC(){

	 	d3.selectAll("#packDiv,#bcDiv,#spDiv").select("svg").remove();

		document.getElementById("descDiv1").textContent = "Select a Town within a UoA from the layout below: ";
		
		document.getElementById("descDiv2").textContent = "Scaled FTE ";

		document.getElementById("descDiv3").textContent = "REF Impact and Environment : X-Axis - Environment 4*, Y-Axis - Impact 4* ";

		var dm1 = modelConstructor(); 
		var dataModel; 
		var pack1;
		var bc;
		var sp; 

		/*=============== READ DATA FILES ================================*/


		d3.queue()
			.defer(d3.csv, "data/topics/REF2014T30TopicOrder.csv")
			.defer(d3.csv, "data/290183_REF_Contextual_table_1314_0.csv")
			.defer(d3.csv, "data/learning-providers-plus.csv")
			.defer(d3.json, "data/topics/REF2014T30Python.json")
			.defer(d3.csv, "data/REF2014_Results.csv")
			.await(initialiseApp)

		/*======================== MAIN FUNCTION =================================
		Carries out all initialization and setup*/
		function initialiseApp(error, ref14data, ref14context , learningProviders, jsonTopicData,REF2014_Results){
			/*Check data files have loaded*/
			if (error) {console . log (" there are errror with loading the data: ", error); return;}

			/*Create data model*/ 
			dm1.loadData(ref14data, ref14context , learningProviders, jsonTopicData,REF2014_Results);	
			dataModel = dm1.model();
			
			/*Layout and render flat data as pack*/
			var nest = d3.nest()
				/*.key(refEntry => refEntry.context.regionProvider)
					 .sortKeys(d3.ascending) //sort a-z*/
				.key(refEntry => refEntry.UoAString)
					 .sortKeys(d3.ascending)
				.key(refEntry => refEntry.lp.TOWN)
					 .sortKeys(d3.ascending)
				.rollup(values => values) /*//add rollup to campact leaves and store refEntry info*/
				.entries(dataModel.refEntries); 
			
	 		pack1 = pack("#packDiv")
				.appendClickFunction(packClickFunction)
				.loadAndRenderNestDataset(nest, "REF2014");

				bcData = dataModel.refEntries.sort(function(a,b){return b.context.scaledFTE-a.context.scaledFTE;})
						.slice(0,20); 

			bc = barchart("#bcDiv")
					.overrideDataFieldFunction(e => e.context.scaledFTE)
					.overrideKeyFunction(e => e["Institution name"])
					.overrideTooltipFunction(e=>{return e["Institution name"] + ", " +e.lp.TOWN})
					.overrideMouseClickFunction(barchartClickFunction)
					.loadAndRenderDataset(bcData);

			sp = scatterplot("#spDiv")
				.overrideDataFieldFunction(e => Number(e.environment["4*"]))
				.overrideDf2Function(e => Number(e.impact["4*"]))
				.overrideTooltipFunction(e=>{return e["Institution name"] + ", " +e.lp.TOWN + ", UoA : " + e.UoAString;})
				.appendedMouseOverFunction(spMouseOverFunction)
				.appendedMouseOutFunction(spMouseOutFunction)
				.appendClickFunction(spClickFunction)
				.loadAndRenderDataset(dataModel.refEntries);

		}

		var townClassesToHighlight;

		function spMouseOverFunction(d){
			ne4 = d.environment["4*"];
			ni4 = d.impact["4*"];

			var refEntriesWithThis = dataModel.refEntries.filter(e => e.environment["4*"] == ne4).filter(e => e.impact["4*"]== ni4);
					townClassesToHighlight = refEntriesWithThis
														.map(function(e){
														 return ".nest-key--"+ e.lp.TOWN.replace(/[\W]+/g,"_");
														});

					pack1.addCSSClassesToDOMelements(townClassesToHighlight, "highlight", true);


		}

		function spMouseOutFunction(d){
			 pack1.addCSSClassesToDOMelements(townClassesToHighlight, "highlight", false);
		}

		function spClickFunction(d,i){
			ne4 = d.environment["4*"];
			ni4 = d.impact["4*"];

			var bcDataForThis = dataModel.refEntries.filter(e => e.environment["4*"] == ne4).filter(e => e.impact["4*"]== ni4);

			bc.loadAndRenderDataset(bcDataForThis);
		}

		function packClickFunction(d,i){
			if(d.height==0){
				var town = d.data.key;
				var uoaString = d.parent.data.key;

				var bcData = dataModel.refEntries.filter(e=>e.lp.TOWN == town).filter(e=>e["UoAString"] == uoaString);

				bc.loadAndRenderDataset(bcData);

				sp.loadAndRenderDataset(bcData);
			}

			if(d.height==1){
				var uoaStringP = d.data.key;
				var spDataP = dataModel.refEntries.filter(e=>e["UoAString"] == uoaStringP);

				var bcDataP = spDataP.sort(function(a,b){return b.context.scaledFTE-a.context.scaledFTE;}).slice(0,20);

				bc.loadAndRenderDataset(bcDataP);

				sp.loadAndRenderDataset(bcDataP);
			}
		}

		function barchartClickFunction(d,i){
			var uni = d["Institution name"];
			var spData = dataModel.refEntries.filter(e=>e["Institution name"] == uni);

			sp.loadAndRenderDataset(spData);

		}
					
}


function ECR(){
	d3.selectAll("#packDiv,#bcDiv,#spDiv").select("svg").remove();

	document.getElementById("descDiv1").textContent = "Select a town within a UoA in the layout below : ";
	
	document.getElementById("descDiv2").textContent = "Number of REF entries for the town in the selection ";

	document.getElementById("descDiv3").textContent = "REF Output and Environment: X-Axis - Output 4*, Y-Axis - Environment 4*";

	var dm1 = modelConstructor(); 
	var dataModel; 
	var bc;
	var sp; 
	var pack1;

	/*=============== READ DATA FILES ================================*/


	d3.queue()
		.defer(d3.csv, "data/topics/REF2014T30TopicOrder.csv")
		.defer(d3.csv, "data/290183_REF_Contextual_table_1314_0.csv")
		.defer(d3.csv, "data/learning-providers-plus.csv")
		.defer(d3.json, "data/topics/REF2014T30Python.json")
		.defer(d3.csv, "data/REF2014_Results.csv")
		.await(initialiseApp)

	/*======================== MAIN FUNCTION =================================
	Carries out all initialization and setup*/
	function initialiseApp(error, ref14data, ref14context , learningProviders, jsonTopicData,REF2014_Results){
		/*Check data files have loaded*/
		if (error) {console . log (" there are errror with loading the data: ", error); return;}

		dm1.loadData(ref14data, ref14context , learningProviders, jsonTopicData,REF2014_Results);	
		dataModel = dm1.model();
		
		var nest = d3.nest()
			/*.key(refEntry => refEntry.context.regionProvider)
				 .sortKeys(d3.ascending) //sort a-z*/
			.key(refEntry => refEntry.UoAString)
				 .sortKeys(d3.ascending)
			.key(refEntry => refEntry.lp.TOWN)
				 .sortKeys(d3.ascending)
			.rollup(values => values) /*//add rollup to campact leaves and store refEntry info*/
			.entries(dataModel.refEntries); 
		
 		pack1 = pack("#packDiv")
			.appendClickFunction(packClickFunction)
			.loadAndRenderNestDataset(nest, "REF2014");

		var bcnest = d3.nest()
					.key(refEntry => refEntry.lp.TOWN)
				 	.sortKeys(d3.ascending)
					.rollup(values => values) /*//add rollup to campact leaves and store refEntry info*/
					.entries(dataModel.refEntries)
					.sort(function(a,b){return b.value.length-a.value.length})
					.slice(0,20); 


		bc = barchart("#bcDiv")
				.overrideDataFieldFunction(d => d.value.length)
				.overrideKeyFunction(d => d.key)
				.overrideTooltipFunction(d => d.value.length)
				.overrideMouseClickFunction(barchartClickFunction)
				.loadAndRenderDataset(bcnest);

		sp = scatterplot("#spDiv")
			.overrideDataFieldFunction(e => Number(e.outputs["4*"]))
			.overrideDf2Function(e => Number(e.environment["4*"]))
			.overrideTooltipFunction(e=>{return e["Institution name"] + ", " +e.lp.TOWN + ", UoA : " + e.UoAString;})
			.appendedMouseOverFunction(spMouseOverFunction)
			.appendedMouseOutFunction(spMouseOutFunction)
			.appendClickFunction(spClickFunction)
			.loadAndRenderDataset(dataModel.refEntries);

	}

	var townClassesToHighlight;

	function spClickFunction(d){
		ne4 = d.environment["4*"];
			no4 = d.outputs["4*"];

			var bcDataForThis = dataModel.refEntries.filter(e => e.environment["4*"] == ne4).filter(e => e.outputs["4*"]== no4);

			var bcnestd = d3.nest()
					.key(refEntry => refEntry.lp.TOWN)
				 	.sortKeys(d3.ascending)
					.rollup(values => values) /*//add rollup to campact leaves and store refEntry info*/
					.entries(bcDataForThis)
					.sort(function(a,b){return b.value.length-a.value.length})
					 
						console.log(bcnestd);
			bc.loadAndRenderDataset(bcnestd);
	}

	function spMouseOverFunction(d){
		no4 = d.outputs["4*"];
		ne4 = d.environment["4*"];

		var refEntriesWithThis = dataModel.refEntries.filter(e => e.environment["4*"] == ne4).filter(e => e.outputs["4*"]== no4);
				townClassesToHighlight = refEntriesWithThis
													.map(function(e){
													 return ".nest-key--"+ e.lp.TOWN.replace(/[\W]+/g,"_");
													});

				pack1.addCSSClassesToDOMelements(townClassesToHighlight, "highlight", true);
	}

	function spMouseOutFunction(d){
			 pack1.addCSSClassesToDOMelements(townClassesToHighlight, "highlight", false);
	}

	function packClickFunction(d,i){
		if(d.height==0){
			var town = d.data.key;
			var uoaString = d.parent.data.key;

			var bcData = dataModel.refEntries.filter(e=>e.lp.TOWN == town).filter(e=>e["UoAString"] == uoaString);

			var bcnest = d3.nest()
					.key(refEntry => refEntry.lp.TOWN)
				 	.sortKeys(d3.ascending)
					.rollup(values => values) /*//add rollup to campact leaves and store refEntry info*/
					.entries(bcData)
					.sort(function(a,b){return b.value.length-a.value.length})
					.slice(0,20); 

					console.log(bcnest);

			bc.loadAndRenderDataset(bcnest);

			sp.loadAndRenderDataset(bcData);
		}

		if(d.height==1){

				var uoaString2 = d.data.key

				var bcData2 = dataModel.refEntries.filter(e=>e["UoAString"] == uoaString2);

			var bcnest2 = d3.nest()
					.key(refEntry => refEntry.lp.TOWN)
				 	.sortKeys(d3.ascending)
					.rollup(values => values) /*//add rollup to campact leaves and store refEntry info*/
					.entries(bcData2)
					.sort(function(a,b){return b.value.length-a.value.length})
					.slice(0,20); 

					console.log(bcnest2);

			bc.loadAndRenderDataset(bcnest2);

			sp.loadAndRenderDataset(bcData2);
		}

	}

	function barchartClickFunction(d,i){

		town = d.key;

		spData = dataModel.refEntries.filter(e=> e.lp.TOWN == town);

		sp.loadAndRenderDataset(spData);

	}

}

