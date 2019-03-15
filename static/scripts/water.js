document.getElementById("add").onclick = function() {
    var date = new Date();
    var day = date.getDate();
    var month = date.getMonth()+1;
    var year = date.getFullYear();
    date = month + '/' + day + '/' + year;
    var node = document.createElement("Li");
    var faucettext = document.getElementById("faucet").value;
    var flushestext = document.getElementById("flushes").value;
    var showertext = document.getElementById("shower").value;

    var final = date + ': ' + faucettext + ' minutes of faucet use, ' + 
                flushestext + ' flushes, and ' + showertext + 
                ' minutes of shower time';
    var textnode=document.createTextNode(final);
    node.appendChild(textnode);
    document.getElementById("list_item").appendChild(node);
}