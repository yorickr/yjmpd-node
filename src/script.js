import path from 'path';

function p(){
    return new Promise((resolve, reject)=>{
        setTimeout(()=>{
            resolve(path.join(__dirname, __filename))
        })
    });
}

async function myAsync(){

    let val = await p();
    console.log('The current path is ', val);
}

myAsync();
