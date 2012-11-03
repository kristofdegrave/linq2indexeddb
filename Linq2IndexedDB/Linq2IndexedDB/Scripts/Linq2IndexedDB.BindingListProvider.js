(function () {

    function WinJSBindingListProvider(bindingList, e) {
        var datasource;
        
        if (bindingList) {
            datasource = bindingList;
        } else {
            datasource = new WinJS.Binding.List();
        }

        attachEvents();

        function attachEvents() {
            if (bindingList) {
                datasource.addEventListener("itemchanged", itemChangedHandler);
                datasource.addEventListener("iteminserted", itemInsertHandler);
                datasource.addEventListener("itemremoved", itemRemoveHandler);
                datasource.addEventListener("itemmutated", itemChangedHandler);
            }
        }
        
        function detachEvents() {
            if (bindingList) {
                datasource.removeEventListener("itemchanged", itemChangedHandler);
                datasource.removeEventListener("iteminserted", itemInsertHandler);
                datasource.removeEventListener("itemremoved", itemRemoveHandler);
                datasource.removeEventListener("itemmutated", itemChangedHandler);
            }
        }

        function itemChangedHandler(arg) {
            e.update(arg.detail.value);
        }
        
        function itemInsertHandler(arg) {
            e.insert(arg.detail.value);
        }
        
        function itemRemoveHandler(arg) {
            e.remove(arg.detail.value);
        }

        return {
            list: datasource,
            populate: function(data) {
                detachEvents();

                for (var i = 0; i < data.length; i++) {
                    datasource.push(data[i]);
                }

                attachEvents();
            }
        };
    }
})()
