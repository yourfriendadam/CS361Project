
document.getElementById("add").onclick  = function() {
    var date = new Date();
    var day = date.getDate();
    var month = date.getMonth()+1;
    var year = date.getFullYear();
    date = month + '/' + day + '/' + year;
    var node = document.createElement("Li");
    var text = document.getElementById("bills").value;
    //text += '     ' + date;
    var final = date + ' ' + ' ' + ' ' + '$' + text;
    var textnode=document.createTextNode(final);
    node.appendChild(textnode);
    document.getElementById("list_item").appendChild(node);
}
