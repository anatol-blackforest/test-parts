const mInlineJsLoadFunc = function(){
    const editToggle = document.getElementById("editToggle");
    const edit = document.getElementById("edit");
    const info = document.getElementById("info");

    let enabled_post = true;

    editToggle.addEventListener("click", function(e){
        edit.classList.toggle("hide");
        info.classList.toggle("hide");    
    })

    document.addEventListener("click", function(e){
      if(e.target.className == "delete"){
          let xhr = new XMLHttpRequest();
          xhr.open('DELETE', `/${e.target.dataset.type}/${e.target.id}`, true);
          xhr.send();
          xhr.onreadystatechange = function() { 
            if (xhr.readyState != 4) return;
            if (xhr.status != 200) {
              console.log(xhr.status + ': ' + xhr.statusText);
              location.href = "/planets"
            } else {
              console.log("GO!");
              console.log(xhr.status + ': ' + xhr.statusText);
              location.href = "/planets"
            }
          }
      }
    });

    edit.addEventListener("submit", function(e){
        e.preventDefault();
        if(title.value && description.value){
          if(enabled_post){
              edit.submit()
              enabled_post = false;
          }
        }else{
          alert("Введите название и описание!");
        }
    });

}

window.addEventListener('load', mInlineJsLoadFunc, false);
