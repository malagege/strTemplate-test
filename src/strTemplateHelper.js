import * as jsYaml from 'js-yaml'
import  template7 from 'template7';

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