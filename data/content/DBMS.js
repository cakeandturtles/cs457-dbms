var query;

var main = function(){
	xml_object = ReadXML("metadata.xml");
	for (var x in xml_object){
		console.log("table: " + x);
		for (var i = 0; i < xml_object[x].length; i++){
			console.log("\tcol: " + xml_object[x][i].full_name);
		}
	}
	
	query = document.getElementById("query").innerHTML.toUpperCase();
	console.log(query);
	var query_object = ParseQuery(query);
	if (query_object === null) return null;
	
	for (var x in query_object){
		console.log(x + ": " + query_object[x]);
	}
	var results_object = QueryData(query_object);
	if (results_object === null) return null;
	PopulateTable(results_object);
}

var ParseQuery = function(query){	
	//Seperate the query into clauses
	var select_index = query.indexOf("SELECT");
	var from_index = query.indexOf("FROM");
	var where_index = query.indexOf("WHERE");
	var select_clause, from_clause, where_clause;
	if (select_index >= 0 && from_index >= 0){
		select_clause = query.slice(select_index, from_index).trim();
		if (where_index >= 0){
			from_clause = query.slice(from_index, where_index).trim();
			where_clause = query.slice(where_index).trim();
			if (where_clause[where_clause.length-1] === ";"){
				where_clause = where_clause.slice(0, where_clause.length-1);
			}
		}else{
			from_clause = query.slice(from_index).trim();
			if (from_clause[from_clause.length-1] === ";"){
				from_clause = from_clause.slice(0, from_clause.length-1);
			}
		}
	}
	else{
		var error = "Query not properly formed.<br/><i>Doesn't contain SELECT or FROM clause</i>";
		document.getElementById("result_table").innerHTML = error;
		return null;
	}
	
	//Parse individual clauses for relevant information
	//Columns to project (FROM THE SELECT CLAUSE)
	var column_array = select_clause.slice(6).trim().split(",");
	if (column_array[0].trim() === ""){
		var error = "Query not properly formed.<br/><i>No columns specified in SELECT clause</i>";
		document.getElementById("result_table").innerHTML = error;
		return null;
	}
	
	//files to load from (FROM THE FROM CLAUSE) //TODO:: Modify to be more flexible with XML
	var load_a = (from_clause.indexOf(" A") > 0 || from_clause.indexOf(",A") > 0);
	var load_b = (from_clause.indexOf(" B") > 0 || from_clause.indexOf(",B") > 0);
	var load_c = (from_clause.indexOf(" C") > 0 || from_clause.indexOf(",C") > 0);
	var cond_array;
	
	//select conditions (FROM THE WHERE CLAUSE)
	if (where_clause){
		cond_array = where_clause.slice(5).trim().split(/(AND|&AMP;&AMP;)/);
		//I don't know why the above keeps the "AND"s/"&&"s as elems in resulting array
		for (var i = cond_array.length-1; i >= 0; i--){
			if (cond_array[i].trim() === "AND" || cond_array[i].trim() === "&AMP;&AMP;")
				cond_array.splice(i, 1);
		}
	}
	if (cond_array && cond_array[0].trim() === ""){
		var error = "Query not properly formed.<br/><i>Empty WHERE clause.</i>";
		document.getElementById("result_table").innerHTML = error;
		return null;
	}

	//TODO:: MOdify to be more flexible with XML
	return {
		column_array: column_array,
		load_a: load_a,
		load_b: load_b,
		load_c: load_c,
		cond_array: cond_array
	};
}

var QueryData = function(query){		
	raw_data = LoadFiles(query);
	selected_data = SelectData(query, raw_data);
	if (selected_data === null){
		var error = "Query not properly formed.<br/><i>Invalid column in WHERE clause.</i>";
		document.getElementById("result_table").innerHTML = error;
		return null;
	}
	
	projected_data = ProjectData(query, selected_data);
	if (projected_data === null){
		var error = "Query not properly formed.<br/><i>Invalid column in SELECT clause.</i>";
		document.getElementById("result_table").innerHTML = error;
		return null;
	}
	return projected_data;
};

//TODO:: Modify to be more flexible with xml
var LoadFiles = function(query){
	var a_data, b_data, c_data;
	
	//Figure out which files to load from, and then load them
	//This loads data every time we query the database
	//Maybe not the best!...
	//ALSO THIS SYSTEM ONLY ASSUMES INTEGER COLUMN VALUES
	if (query.load_a){
		a_text = StripNewLines(readTextFile("A.txt").split('\n'));
		a_data = [];
		for (var i = 0; i < a_text.length; i++){
			var a_row = a_text[i].split('\t');
			a_data.push({
				'A1': parseInt(a_row[0]), 
				'A2': parseInt(a_row[1])
			});
		}
	}
	if (query.load_b){
		b_text = StripNewLines(readTextFile("B.txt").split('\n'));
		
		b_data = [];
		for (var i = 0; i < b_text.length; i++){
			var b_row = b_text[i].split('\t');
			b_data.push({
				'B1': parseInt(b_row[0]), 
				'B2': parseInt(b_row[1]), 
				'B3': parseInt(b_row[2])
			});
		}
	}
	if (query.load_c){
		c_text = StripNewLines(readTextFile("C.txt").split('\n'));
		c_data = [];
		for (var i = 0; i < c_text.length; i++){
			var c_row = c_text[i].split('\t');
			c_data.push({
				'C1': parseInt(c_row[0]), 
				'C2': parseInt(c_row[1]), 
				'C3': parseInt(c_row[2]), 
				'C4': parseInt(c_row[3])
			});
		}
	}
	return {'A': a_data, 'B': b_data, 'C': c_data};
};

var SelectData = function(query, raw_data){
	//Now, apply the conditions (If there are any)
	if (query.cond_array){
		for (var i = 0; i < query.cond_array.length; i++){
			var refined_data = {};
			var elems = query.cond_array[i].split("=");
			elems[0] = elems[0].trim();
			elems[1] = elems[1].trim();
			var table1 = SearchForTable(raw_data, elems[0]);
			var table2 = SearchForTable(raw_data, elems[1]);
			var value;
			if (table1 === null){
				return null;
			}else if (table2 === null){
				try{
					value = eval(elems[1]);
				}catch(err){
					return null;
				}
			}
			
			//SELECT BASED ON COLUMN VALUE
			if (value){
				new_table = table1.name;
				refined_data[new_table] = [];
				for (var j = 0; j < table1.table.length; j++){
					if (eval(table1.table[j][elems[0]]) == value){
						refined_data[new_table].push(table1.table[j]);
					}
				}
				delete raw_data[table1.name];
			}
			//EQUIJOIN TWO TABLES
			else if (table1.name !== table2.name){
				new_table = table1.name + table2.name
				refined_data[new_table] = [];
				/*alert(new_table + ", elem0: " + elems[0] + ", elem1: " + elems[1]);*/
				for (var j = 0; j < table1.table.length; j++){
					for (var k = 0; k < table2.table.length; k++){
						/*if (table1.table[j][elems[0]] == 22){
							alert(table1.table[j][elems[0]] + " = " + table2.table[k][elems[1]] + "; " + (table1.table[j][elems[0]] == table2.table[k][elems[1]]));
						}*/
						if (table1.table[j][elems[0]] == table2.table[k][elems[1]]){
							//alert(table1.table[j][elems[0]] + ", " + table2.table[k][elems[1]]);
							var new_row = {};
							for (var col in table1.table[j]){ 
								new_row[col] = table1.table[j][col];
							}
							for (var col in table2.table[k]){
								new_row[col] = table2.table[k][col];
							}
							
							refined_data[new_table].push(new_row);
						}
					}
				}
				
				delete raw_data[table1.name];
				delete raw_data[table2.name];
			}
			//EQUIJOIN SINGLE TABLE BETWEEN TWO OF ITS COLUMNS
			else{
				new_table = table1.name;
				refined_data[new_table] = [];
				for (var j = 0; j < table1.table.length; j++){
					if (table1.table[j][elems[0]] == table1.table[j][elems[1]]){
						refined_data[new_table].push(table1.table[j]);
					}
				}
				delete raw_data[table1.name];
			}
			
			//add all defined tables that haven't already been added or joined
			for (var table in raw_data){
				var found_table = false;
				if (raw_data[table]){
					refined_data[table] = raw_data[table];
					delete raw_data[table];
				}
			}
			
			raw_data = refined_data;
		}
	}
	return raw_data; //Not really raw anymore...
}

var ProjectData = function(query, selected_data){
	//TODO:: Modify to be more flexible with xml
	//Now, project selected columns (get rid of the rest...)
	var all_cols = ["A1", "A2", "B1", "B2", "B3", "C1", "C2", "C3", "C4"];
	for (var i = 0; i < query.column_array.length; i++){
		var found_col = false;
		for (var j = 0; j < all_cols.length; j++){
			if (all_cols[j].trim() == query.column_array[i].trim()){
				found_col = true;
				break;
			}
		}
		if (!found_col){
			return null;
		}
	}
	
	for (var table in selected_data){
		if (selected_data[table]){
			for (var col in selected_data[table][0]){
				var found_col = false;
				for (var i = 0; i < query.column_array.length; i++){
					if (query.column_array[i].trim() === col.trim()){
						found_col = true;
					}
				}
				if (!found_col){
					for (var i = 0; i < selected_data[table].length; i++){
						delete selected_data[table][i][col];
					}
				}
			}
		}
	}
	return selected_data;
};

var SearchForTable = function(data, col_name){
	//TODO:: Modify to be more flexible with xml
	//This can really only work because each table has unique column names
	var all_cols = ["A1", "A2", "B1", "B2", "B3", "C1", "C2", "C3", "C4"];
	var found_col = false;
	for (var i = 0; i < all_cols.length; i++){
		if (all_cols[i] == col_name){
			found_col = true;
			break;
		}
	}
	if (!found_col){ 
		return null;
	}
	
	//Loop through all currently existing tables
	for (var table in data){
		if (data[table]){
			for (var col in data[table][0]){
				if (col_name === col){
					return {name: table, table: data[table]};
				}
			}
		}
	}
	return null;
};

var PopulateTable = function(results){
	var max_length = 0;
	for (var table in results){
		if (results[table]){
			if (results[table].length > max_length)
				max_length = results[table].length;
		}
	}
	if (max_length === 0){
		var error = "<i>Query returned no rows.</i>";
		document.getElementById("result_table").innerHTML = error;
		return false;
	}

	var table_text = "";
	//PRINT OUT COL NAMES
	table_text += "<tr>";
	for (var table in results){
		if (results[table]){
			for (var col in results[table][0]){
				table_text += "<th>";
				table_text += col;
				table_text += "</th>";
			}
		}
	}

	table_text += "</tr>";
	//PRINT OUT DATA
	//Loop through rows
	for (var i = 0; i < max_length; i++){
		//Loop through tables
		table_text += "<tr>";
		for (var table in results){
			if (results[table]){
				//Loop through cols
				for (var col in results[table][0]){
					table_text += "<td>";
					if (i < results[table].length){
						table_text += results[table][i][col];
					}
					table_text += "</td>";
				}
			}
		}
		table_text += "</tr>";
	}

	document.getElementById("result_table").innerHTML = table_text;
	return true;
};