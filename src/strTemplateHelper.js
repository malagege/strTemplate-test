import * as jsYaml from 'js-yaml'
import  template7 from 'template7';


template7.registerHelper('pascal', function (text, options){
    if(!!!text){
        return ""
    }
    let firstChar = text.substr(0,1).toUpperCase();
    return firstChar + text.substr(1);
});

template7.registerHelper('camel', function (text, options){
    if(!!!text){
        return ""
    }
    let firstChar = text.substr(0,1).toLowerCase();
    return firstChar + text.substr(1);
});


function parseYaml(str){
    return jsYaml.load(str)
}

function dumpYaml(obj){
    return jsYaml.dump(obj)
}

function strTemplate(str, data){
    var compiledTemplate = template7.compile(str)
    var templateStr = compiledTemplate(data);
    return templateStr
}


export {
    parseYaml,
    strTemplate,
    dumpYaml
}