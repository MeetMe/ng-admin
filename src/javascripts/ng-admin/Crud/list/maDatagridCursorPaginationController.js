import angular from 'angular';

export default class DatagridCursorPaginationController {
    constructor($scope, $stateParams, $location, $window) {
        this.$scope = $scope;
        this.$stateParams = $stateParams;
        this.$location = $location;
        this.$window = $window;
        var perPage = parseInt(this.$scope.perPage, 10) || 1,
            pageItems = parseInt(this.$scope.pageItems, 10),
            totalItems = 0;

        this.currentCursor = this.$scope.currentCursor === "" ? null : this.$scope.currentCursor;
        this.nextCursor = this.$scope.nextCursor === "" ? null : this.$scope.nextCursor;

        var cursorHistory = this.getCursorHistory();

        cursorHistory.cursors
                    .filter(r=>r.cursor === this.currentCursor)
                    .forEach(r=>{
                        r.count = pageItems;
                    });
        this.updateCursorHistory(cursorHistory);

        cursorHistory.cursors.forEach(cursor => {
            totalItems += cursor.count ? cursor.count : 0;
        });

        this.offsetBegin = 0;
        this.cursorPage = 1;
        for (var i in cursorHistory.cursors) {
            if (cursorHistory.cursors[i].cursor != this.currentCursor) {
                this.offsetBegin += cursorHistory.cursors[i].count ? cursorHistory.cursors[i].count : 0;
                this.cursorPage++;
            } else {
                break;
            }
        }
        this.offsetEnd = this.offsetBegin + pageItems;
        this.totalItemsDisplay = totalItems + (this.nextCursor != null ? "+" : "");

        // if there is only onepage (it's the first page, and there is no next cursor)
        this.displayPagination = !(this.currentCursor == null && this.nextCursor == null);
        this.pageItems = pageItems;
        this.totalItems = totalItems;
        $scope.$on('$destroy', this.destroy.bind(this));
    }

    getCursorHistory() {
        return this.$stateParams.cursorHistory || { 
            'cursors' : [ { 'cursor': null, 'count': undefined } ]
        };
    }

    updateCursorHistory(cursorHistory) {
        this.$location.search('cursorHistory', JSON.stringify(cursorHistory));
    }

    /**
     * Reset cursor history and cursor
     */
    resetCursor() {
        delete this.$stateParams.cursorHistory;
        const cursorHistory = this.getCursorHistory();
        this.updateCursorHistory(cursorHistory);
        this.setCursor(null);
    }

    /**
     * Link to the next page
     */
    nextPage() {
        if (this.nextCursor == null) {
            return;
        }
        this.setCursor(this.nextCursor);
    }

    /**
     * Link to the next page
     */
    setCursor(cursor) {
        if (cursor === undefined) {
            return;
        }
        this.$scope.setCursor()(cursor);

        const cursorHistory = this.getCursorHistory();

        if (!cursorHistory.cursors.map(r => r.cursor).includes(cursor)) {
            cursorHistory.cursors.push({ 
                'cursor': cursor,
                'count': undefined
            });
        }
        this.updateCursorHistory(cursorHistory);
    }

    /**
     * Link to the next page
     */
    setCursorIndex(index) {
        const cursorHistory = this.getCursorHistory();

        if (index === undefined || index < 1 || index - 1 > cursorHistory.cursors.length) {
            return;
        }
        
        const record = cursorHistory.cursors[index - 1];
        this.setCursor(record.cursor);
    }
    /**
     * Return an array with the range between min & max, useful for pagination
     *
     * @param {int} min
     * @param {int} max
     * @returns {Array}
     */
    range(cursorPage) {
        const cursorHistory = this.getCursorHistory();

        var input = [];
        
        for (let index = 0; index < cursorHistory.cursors.length; index++) {
            const record = cursorHistory.cursors[index];

            if (index < 2 ||
                index >= cursorHistory.cursors.length - 2 || 
                Math.abs(cursorPage - index - 1) < 2) {
                input.push( '' + (index + 1));
            } else {
                if (input.length == 0 || input[input.length - 1] !== '.') {
                    input.push( '.' );
                }
            }
        };

        return input;
    }

    destroy() {
        this.$scope = undefined;
    }
}

DatagridCursorPaginationController.$inject = ['$scope', '$stateParams', '$location', '$window'];
