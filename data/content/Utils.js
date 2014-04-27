//http://stackoverflow.com/questions/1418050/string-strip-for-javascript
if(typeof(String.prototype.trim) === "undefined"){
    String.prototype.trim = function() 
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

//http://stackoverflow.com/questions/14446447/javascript-read-local-text-file
function readTextFile(file)
{
	var file_text;
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.send();
	return rawFile.responseText;
}