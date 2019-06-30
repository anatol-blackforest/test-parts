(function ($) {
    'use strict';


    var tagRemover = function (string) {
        return string.replace(/(<([^>]+)>)/ig,"");
    }

    jQuery(document).ready(function () {

        const socket = io.connect('http://localhost:3000');
        socket.emit('loaded')

        socket.on('message', function(result){

            var html = ""

            result.forEach((item, i) => {
                html += `<div class="col-md-12 blog-post">
                    <div class="post-title">
                        <h1>${i+1}. ${tagRemover(item.product_name)}</h1>

                        <p>Цена: ${item.price}</p>
                        <p>Ссылка: <a href="${item.link}" target="_blank">${item.link}</p>
                    
                    </div>  
                </div>`
            })
            $('.preloader2').fadeOut();
            $('#bloglist').html(html)

        })

        
       /* Preloader */
		
        $(window).load(function () {
            $('.preloader').delay(800).fadeOut('slow');
         });
		 		
		
       /* Smooth Scroll */

        $('a.smoth-scroll').on("click", function (e) {
            var anchor = $(this);
            $('html, body').stop().animate({
                scrollTop: $(anchor.attr('href')).offset().top - 50
            }, 1000);
            e.preventDefault();
        });
		
		
       /* Scroll To Top */
		
        $(window).scroll(function(){
        if ($(this).scrollTop() >= 500) {
            $('.scroll-to-top').fadeIn();
         } else {
            $('.scroll-to-top').fadeOut();
         }
         });
	
	
        $('.scroll-to-top').click(function(){
          $('html, body').animate({scrollTop : 0},800);
          return false;
          });
		  
		  
		  
       /* Tooltip */
	   
        $('[data-toggle="tooltip"]').tooltip();



       /* Popover */
	   
        $('[data-toggle="popover"]').popover();		  
        
        // API

        $( document ).ready(function() {

            //шлем запрос
            $("#form").submit(
                function(e){
                    e.preventDefault()
                    $('.preloader2').show();
                    var trigger = true
                    $('#form input[type="text"], #form textarea').each(function(){
                        if(!$(this).val() || $(this).val() == ''){
                           $(this).css('border-color','red');//Сделаем бордер красным
                           trigger = false
                        }
                    });
                    
                    if (trigger) { 
                        $.ajax({
                            url:     "/", //url страницы 
                            type:     "POST", //метод отправки
                            dataType: "html", //формат данных
                            data: $("#form").serialize(),  // Сериализуем объект
                            success: function(response) { //Данные отправлены успешно
                                var result = $.parseJSON(response);
                                $('#hint').html(result.Message)

                                $("#form").trigger('reset')
                                $("#load-more-post").hide()
                                $('.preloader2').fadeOut();
                            },
                            error: function() { // Данные не отправлены
                                $('#bloglist').html('Ошибка. Данные не отправлены.');
                            }
                        });

                    }
                }
            );


           

        });

	  
		   
    });

   })(jQuery);