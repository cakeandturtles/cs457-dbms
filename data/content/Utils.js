//http://stackoverflow.com/questions/1418050/string-strip-for-javascript
if(typeof(String.prototype.trim) === "undefined"){
    String.prototype.trim = function() 
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

//http://stackoverflow.com/questions/14446447/javascript-read-local-text-file
function readTextFile(filename)
{
	var file_text;
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", filename, false);
    rawFile.send();
	return rawFile.responseText;
}

var StripNewLines = function(text_array){
	for (var i = 0; i < text_array.length; i++){
		if (text_array[i][text_array.length-1] === '\n'){
			text_array[i] = text_array[i].substring(0, text_array[i].length-1);
		}
	}
	return text_array;
};

var ReadXML = function(filename){
	var xml_text = readTextFile(filename);
	var xml_object = {};
	
	var index = 0;
	var node = ReadNextXMLNode(xml_text, index);
	index += node.length;
	//This scheme only allows a depth of 1 node nesting (only columns within tables)
	var parent_node;
	while(node.pos != -1){
		switch (node.pos){
			case 0: //Only tables will be start nodes
				xml_object[node.name] = [];
				parent_node = node;
				break;
			case 1: //Only columns will be complete nodes
				xml_object[parent_node.name].push({
					table: parent_node.name,
					name: node.name,
					full_name: parent_node.name + "." + node.name
				});
				break;
			case 2: //Only tables will be end nodes
				delete parent_node;
				break;
		}
		
		node = ReadNextXMLNode(xml_text, index);
		index += node.length;
	}
	return xml_object;
};

/*This will only work for XML nodes formed as follows:
	<type name="name"></type> OR <type name="name"/>*/
var ReadNextXMLNode = function(xml_text, index){
	var node = {
		type: "",
		name: "",
		length: 0,
		pos: -1 //POS IS EITHER 0 (start), 1 (complete), 2 (end), -1 (invalid node)
	};
	
	if (index >= xml_text.length) return node;
	
	//SKIP WHITESPACE
	var token = xml_text[index];
	while (token === " " || token === "\n" || token === "\r" || token == "\t"){
		index++;
		node.length++;
		token = xml_text[index];
	}
	index++;
	node.length++;
	if (token !== "<") return node;
	//READ IN THE REST OF THE NODE AS STRING
	while(token[token.length-1] !== ">"){
		if (index >= xml_text.length) return node;
		token += xml_text[index];
		index++;
		node.length++;
	}
	
	//CONSTRUCT THE NODE OBJECT
	//NODE STRUCTURE:: <type name="name"/> OR </type>
	if (token[token.length-2] === "/"){
		var name_index = token.indexOf("name=\"");
		//NODE STRUCTURE <type name="name"/>
		if (name_index > 0){
			node.pos = 1;
			node.type = token.substring(1, name_index);
			node.name = token.substring(name_index+6, token.length-3);
		}
		//NODE STRUCTURE </type>
		else{
			node.pos = 2;
			node.type = token.substring(2,token.length-1);
		}
	}
	//NODE STRUCTURE <type name="name">
	else{
		var name_index = token.indexOf("name=\"");
		node.pos = 0;
		node.type = token.substring(1, name_index);
		node.name = token.substring(name_index+6, token.length-2);
	}
	return node;
};