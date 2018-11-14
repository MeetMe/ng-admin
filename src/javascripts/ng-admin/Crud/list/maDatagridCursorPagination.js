import cursorPaginationView from './maDatagridCursorPagination.html';
import DatagridCursorPaginationController from './maDatagridCursorPaginationController';

export default function maDatagridCursorPagination() {
    return {
        restrict: 'E',
        scope: {
            currentCursor: '@',
            nextCursor: '@',
            perPage: '@',
            totalItems: '@',
            setCursor: '&'
        },
        template: cursorPaginationView,
        controllerAs: 'paginationCtrl',
        controller: DatagridCursorPaginationController
    };
}

maDatagridCursorPagination.$inject = [];
