import * as jsYaml from 'js-yaml'

function parseYaml(str){
    return jsYaml.load(str)
}


function strTemplate(str, data){
    console.log('hello',Object.keys(data))
    let template = str;
    Object.keys(data).forEach( key => {
        let paramRegex = new RegExp('{{\\s*' + key +'\\s*}}','i')
        let paramValue = data[key]
        console.log('paramRegex', paramRegex, 'paramValue', paramValue)
        template = template.replace( paramRegex, paramValue ) 
        console.log('template:',template)
    })
    return template
}


export {
    parseYaml,
    strTemplate
}