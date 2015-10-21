$(document).ready(function() {
	//Количество изображений. 0 при новой статье или число при редактирвоании существующей
	var imgs = $('#max_img').val() || '0';
	//Добавление загруженного изображения в текст
	$('.files').on('change', '.image_load', function() {
		if($(this).data('load') == true) {
			$(this).data('load', false);
			$('#article_text').val($('#article_text').val() + '[ЗагруженноеИзображение' + imgs + ']');
			imgs++;
			// Создание нового поля загрузки
			$('<input type="file" class="image_load" data-load="true" name="f' + imgs + '"><br>').appendTo('.files');
		}
	});
});