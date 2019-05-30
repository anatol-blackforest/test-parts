const mInlineJsLoadFunc = function(){
  const fieldsetPlanet = document.getElementById("fieldsetPlanet");
  const fieldsetMoon = document.getElementById("fieldsetMoon");
  const parentPlanet = document.getElementById("parentPlanet");
  const description = document.getElementById("description");
  const upload = document.getElementById("upload");
  const title = document.getElementById("title");
  const type = document.getElementById("type");

  let enabled_post = true;

  upload.addEventListener("change", function(e){
    if(type.value == "planet"){
      fieldsetPlanet.classList.remove("hide"); 
      fieldsetMoon.classList.add("hide");   
    }else{
      fieldsetPlanet.classList.add("hide"); 
      fieldsetMoon.classList.remove("hide"); 
    }
  })

  upload.addEventListener("submit", function(e){
    e.preventDefault();
    if(title.value && description.value){
      if(enabled_post){
        if(type.value == "moon"){
          if(parentPlanet.value.trim()){
            upload.submit();
            enabled_post = false;
          }else{
            alert("Введите материнскую планету!");
          }
        }else{
          upload.submit();
          enabled_post = false;
        }
      }
    }else{
      alert("Введите название и описание!");
    }
  });

}

window.addEventListener('load', mInlineJsLoadFunc, false);
