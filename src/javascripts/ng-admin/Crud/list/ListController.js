import Entry from 'admin-config/lib/Entry';

export default class ListController {
    constructor($scope, $stateParams, $location, $anchorScroll, $compile, ReadQueries, progression, view, dataStore, totalItems, currentCursor, nextCursor) {
        this.$scope = $scope;
        this.$stateParams = $stateParams;
        this.$location = $location;
        this.$compile = $compile;
        this.$anchorScroll = $anchorScroll;
        this.ReadQueries = ReadQueries;
        this.progression = progression;
        this.view = view;
        this.entity = view.getEntity();
        this.loadingPage = false;
        this.search = $stateParams.search;
        this.dataStore = dataStore;
        this.fields = view.fields();
        this.listActions = view.listActions();
        this.totalItems = totalItems;
        this.page = $stateParams.page || 1;
        this.currentCursor = currentCursor;
        this.nextCursor = nextCursor;
        this.infinitePagination = this.view.infinitePagination();
        this.cursorPagination = this.view.cursorPagination();
        this.entryCssClasses = this.view.getEntryCssClasses.bind(this.view);
        this.nextPageCallback = this.nextPage.bind(this);
        this.setPageCallback = this.setPage.bind(this);
        this.setCursorCallback = this.setCursor.bind(this);
        this.resetCursorCallback = this.resetCursor.bind(this);
        this.sortField = this.$stateParams.sortField || this.view.getSortFieldName();
        this.sortDir = this.$stateParams.sortDir || this.view.sortDir();
        this.queryPromises = [];

        if (this.cursorPagination) {
            const cursorHistory = this.getCursorHistory();
            cursorHistory.cursors
                        .filter(r=>r.cursor === currentCursor)
                        .forEach(r=>{
                            r.count = totalItems;
                        });
            this.updateCursorHistory(cursorHistory);
        }

        if ($scope.selectionUpdater) {
            $scope.selection = $scope.selection || [];
            $scope.$watch('selection', $scope.selectionUpdater);
        } else {
            $scope.selection = null;
        }

        $scope.$on('$destroy', this.destroy.bind(this));
    }

    nextPage(page) {
        if (this.cursorPagination) {
            this._fetchPageOrCursor(page, this.ReadQueries.getAllWithCursor);
        } else {
            this._fetchPageOrCursor(page, this.ReadQueries.getAll);
        }
    }

    _fetchPageOrCursor(page, getAll) {
        if (this.loadingPage) {
            return;
        }

        let view = this.view,
            dataStore = this.dataStore;

        this.progression.start();

        const references = view.getReferences();
        let data;
        const toAddToDatastore = [];

        let queryPromise = getAll.apply(this.ReadQueries, [this.view, page, this.search, this.sortField, this.sortDir])
            .then(response => {
                data = response.data;
                return this.ReadQueries.getReferenceData(view.fields(), data);
            })
            .then((referenceData) => {
                this.progression.done();

                for (var name in referenceData) {
                    Entry.createArrayFromRest(
                        referenceData[name],
                        [references[name].targetField()],
                        references[name].targetEntity().name(),
                        references[name].targetEntity().identifier().name()
                    ).map(entry => {
                        toAddToDatastore.push([
                            references[name].targetEntity().uniqueId + '_values',
                            entry
                        ])
                    });
                }
            });
        this.queryPromises.push(queryPromise);
        // make sure all preceding promises complete before loading data into store
        Promise.all(this.queryPromises)
            .then(() => {
                this.$scope.$apply(() => {
                    toAddToDatastore.map((args) => {
                        this.dataStore.addEntry(...args);
                    });

                    view.mapEntries(data)
                        .map(entry => {
                            this.dataStore.fillReferencesValuesFromEntry(entry, references, true);
                            this.dataStore.addEntry(this.entity.uniqueId, entry);
                        });
                    this.loadingPage = false;
                });
            });
    }

    getCursorHistory() {
        return this.$stateParams.cursorHistory || { 'cursors' : [ { 'cursor': null, 'count': undefined } ] };
    }

    resetCursor() {
        delete this.$stateParams.cursorHistory;
        const cursorHistory = this.getCursorHistory();
        this.$location.search('cursor', null);
        this.updateCursorHistory(cursorHistory);
        this.$anchorScroll(0);
    }

    setCursor(cursor) {
        const cursorHistory = this.getCursorHistory();

        if (!cursorHistory.cursors.map(r => r.cursor).includes(cursor)) {
            cursorHistory.cursors.push({ 
                'cursor': cursor,
                'count': undefined
            });
        }

        this.$location.search('cursor', cursor);
        this.updateCursorHistory(cursorHistory);
        this.$anchorScroll(0);
    }

    updateCursorHistory(cursorHistory) {
        this.$location.search('cursorHistory', JSON.stringify(cursorHistory));
    }

    setPage(number) {
        this.$location.search('page', number);
        this.$anchorScroll(0);
    }

    destroy() {
        this.$scope = undefined;
        this.$stateParams = undefined;
        this.$location = undefined;
        this.$anchorScroll = undefined;
        this.dataStore = undefined;
    }
}

ListController.$inject = ['$scope', '$stateParams', '$location', '$anchorScroll', '$compile', 'ReadQueries', 'progression', 'view', 'dataStore', 'totalItems', 'currentCursor', 'nextCursor'];
