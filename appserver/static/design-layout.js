require(['jquery', 'underscore', 'splunkjs/mvc'], function($, _, mvc) {
     function setToken(name, value) {
         var defaultTokenModel = mvc.Components.get('default');
         if (defaultTokenModel) {
             defaultTokenModel.set(name, value);
         }
         var submittedTokenModel = mvc.Components.get('submitted');
         if (submittedTokenModel) {
             submittedTokenModel.set(name, value);
         }
     }
     
 // The Submit Button
	 $("#runSearch").on("click", function(e){
		 setToken("search", $("#originalSearch").val());
	 });
	 
	 
	
 });
