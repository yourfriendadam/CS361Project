var beautify_js = require('js-beautify');
var beautify_css = require('js-beautify').css;
var beautify_html = require('js-beautify').html;
var fs = require('fs');

// This object is a list of beautify methods and files, which is used to specify
// which beautifier gets used on which files. 
beautify_hash = [{
        method: beautify_js,
        name: 'Javascript',
        files: [
            'app.js',
            'beautify.js',
            'dbcon.js',
        ]
    },
    {
        method: beautify_html,
        name: 'HTML',
        files: [
            'views/404.handlebars',
            'views/500.handlebars',
            'views/createAccount.handlebars',
            'views/electricity.handlebars',
            'views/foo.handlebars',
            'views/food.handlebars',
            'views/landing.handlebars',
            'views/layouts/main.handlebars',
            'views/login.handlebars',
            'views/logout.handlebars',
            'views/shower.handlebars',
            'views/transportation.handlebars',
            'views/water.handlebars',
        ]
    },
]

// For each beautification method and list of files
beautify_hash.forEach(function(item) {
    // For each file in the list of files for this method
    item.files.forEach(function(file) {
        // Read and beautify the file
        fs.readFile(file, 'utf8', function(err, data) {
            if (err) {
                throw err;
            }
            fs.writeFile(file, item.method(data, {
                indent_size: 4,
                space_in_empty_paren: true,
                end_with_newline: true,
            }), function(err, data) {
                if (err) {
                    throw err;
                }
                console.log(item.name + ": Beautified " + file);
            })
        });
    });
});
