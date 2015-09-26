$(document).ready(function() {
	//Номер изображения
	var imgs = 0 || $('#max_img').val();
	//Добавление загруженного изображения в текст
	$('.files').on('change', '.image_load', function() {
		if($(this).data('load') == true) {
			$(this).data('load', false);
			$('#article_text').val($('#article_text').val() + '[ЗагруженноеИзображение' + imgs + ']');
			imgs++;
			$('<input type="file" class="image_load" data-load="true" name="f' + imgs + '"><br>').appendTo('.files');
		}
	});
});