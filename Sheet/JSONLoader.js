/**
 * @project jQuery.sheet() The Ajax Spreadsheet - http://code.google.com/p/jquerysheet/
 * @author RobertLeePlummerJr@gmail.com
 * $Id: jquery.sheet.dts.js 933 2013-08-28 12:59:30Z robertleeplummerjr $
 * Licensed under MIT
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

;Sheet.JSONLoader = (function($, document) {
    "use strict";
    function Constructor(json) {
		if (json !== undefined) {
			this.json = json;
			this.count = json.length;
		} else {
			this.json = [];
			this.count = 0;
		}
    }

    Constructor.prototype = {
        size: function(spreadsheetIndex) {
            var size = {
                    cols: 0,
                    rows: 0
                },
                json = this.json,
                jsonSpreadsheet,
                rows,
                firstRow,
                firstRowColumns;

            if ((jsonSpreadsheet = json[spreadsheetIndex]) === undefined) return size;
            if ((rows = jsonSpreadsheet.rows) === undefined) return size;
            if ((firstRow = rows[0]) === undefined) return size;
            if ((firstRowColumns = firstRow.columns) === undefined) return size;

            return {
                rows: rows.length,
                cols: firstRowColumns.length
            };
        },
        setWidth: function(sheetIndex, columnIndex, colElement) {
            var json = this.json,
                jsonSpreadsheet = json[sheetIndex],
                metadata = jsonSpreadsheet.metadata || {},
                widths = metadata.widths || [],
                width = widths[columnIndex];

            colElement.style.width = width + 'px';
        },
        setRowHeight: function(sheetIndex, rowIndex, barTd) {
            var json = this.json,
                jsonSpreadsheet,
                rows,
                row,
                height;

            if ((jsonSpreadsheet = json[sheetIndex]) === undefined) return;
            if ((rows = jsonSpreadsheet.rows) === undefined) return;
            if ((row = rows[rowIndex]) === undefined) return;
            if ((height = row.height) === undefined) return;

            barTd.style.height = height + 'px';
        },
        setupCell: function(sheetIndex, rowIndex, columnIndex, createCellFn) {
            var td = document.createElement('td'),
				$td = $(td),
				jsonCell = this.getCell(sheetIndex, rowIndex, columnIndex),
				cell;

            if (jsonCell !== null) {

				if (jsonCell.getJitCell !== undefined) {
					cell = jsonCell.getJitCell();
					delete jsonCell.getJitCell;

					if (cell['formula']) {
						td.setAttribute('data-formula', cell['formula'] || '');
						if (cell.result !== null) {
							$td.html(cell.result.hasOwnProperty('html') ? cell.result.html : cell.result);
						}
					} else {
						$td.html(cell['value']);
					}
				} else {
					cell = createCellFn(td);
					cell.value = jsonCell['value'];
					if (jsonCell['formula']) {
						cell.formula = jsonCell['formula'] || '';
						td.setAttribute('data-formula', jsonCell['formula'] || '');
					} else {
						$td.html(jsonCell['value']);
					}
				}

				td.className = jsonCell['class'] || '';
				td.setAttribute('style', jsonCell['style'] || '');

				if (jsonCell['rowspan']) td.setAttribute('rowspan', jsonCell['rowspan'] || '');
				if (jsonCell['colspan']) td.setAttribute('colspan', jsonCell['colspan'] || '');
				if (jsonCell['uneditable']) td.setAttribute('data-uneditable', jsonCell['uneditable'] || '');
				if (jsonCell['id']) {
					td.setAttribute('id', jsonCell['id']);
				}
			} else {
				cell = createCellFn(td);
			}

			td.jSCell = cell;
			cell.td = $td;
            return cell;
        },
		getCell: function(sheetIndex, rowIndex, columnIndex) {
			var json = this.json,
				jsonSpreadsheet,
				rows,
				row,
				cell;

			if ((jsonSpreadsheet = json[sheetIndex]) === undefined) return null;
			if ((rows = jsonSpreadsheet.rows) === undefined) return null;
			if ((row = rows[rowIndex - 1]) === undefined) return null;
			if ((cell = row.columns[columnIndex - 1]) === undefined) return null;

			return cell;
		},
		jitCell: function(sheetIndex, rowIndex, columnIndex) {
			var cell = this.getCell(sheetIndex, rowIndex, columnIndex),
				fakeTd,
				jitCell;

			if (cell === null) return null;

			if (cell.getJitCell !== undefined) {
				return cell.getJitCell();
			}

			fakeTd = {
				cellIndex: columnIndex,
					parentNode:{
						rowIndex: rowIndex
				},
				html: function() {}
			};

			jitCell = {
				td: {0:fakeTd},
				html: [],
				state: [],
				calcCount: 0,
				calcLast: -1,
				calcDependenciesLast: -1,
				cellType: cell['cellType'] || '',
				formula: cell['formula'] || '',
				value: cell['value'] || '',
				uneditable: cell['uneditable'],
				type: 'cell',
				sheet: sheetIndex,
				dependencies: [],
				id: null
			}

			cell.getJitCell = function() {
				return jitCell;
			};

			return jitCell;
		},
		title: function(sheetIndex) {
			var json = this.json,
				jsonSpreadsheet;

			if ((jsonSpreadsheet = json[sheetIndex]) === undefined) return '';

			return jsonSpreadsheet.title || '';
		},
		getSpreadsheetIndexByTitle: function(title) {
			var json = this.json,
				max = this.count,
				i = 0;

			for(;i < max; i++) {
				if (json[i].title == title) {
					return i;
				}
			}

			return -1;
		},
	    addSpreadsheet: function(jsonSpreadsheet, atIndex) {
		    if (atIndex === undefined) {
		        this.json.push(jsonSpreadsheet);
		    } else {
			    this.json.splice(atIndex, 0, jsonSpreadsheet);
		    }
		    this.count = this.json.length;
	    },
		setCellAttribute: function(cell, attribute, value) {
			cell[attribute] = value;
		},
        /**
         * Create a table from json
         * @param {Array} json array of spreadsheets - schema:<pre>
         * [{ // sheet 1, can repeat
			 *  "title": "Title of spreadsheet",
			 *  "metadata": {
			 *      "widths": [
			 *          120, //widths for each column, required
			 *          80
			 *      ]
			 *  },
			 *  "rows": [
			 *      { // row 1, repeats for each column of the spreadsheet
			 *          "height": 18, //optional
			 *          "columns": [
			 *              { //column A
			 *                  "cellType": "", //optional
			 *                  "class": "css classes", //optional
			 *                  "formula": "=cell formula", //optional
			 *                  "value": "value", //optional
			 *                  "style": "css cell style", //optional
			 *                  "uneditable": true, //optional
			 *                  "cache": "" //optional
			 *              },
			 *              {} //column B
			 *          ]
			 *      },
			 *      { // row 2
			 *          "height": 18, //optional
			 *          "columns": [
			 *              { // column A
			 *                  "cellType": "", //optional
			 *                  "class": "css classes", //optional
			 *                  "formula": "=cell formula", //optional
			 *                  "value": "value", //optional
			 *                  "style": "css cell style" //optional
			 *                  "uneditable": true, //optional
			 *                  "cache": "" //optional
			 *              },
			 *              {} // column B
			 *          ]
			 *      }
			 *  ]
			 * }]</pre>
         * @returns {*|jQuery|HTMLElement} a simple html table
         * @memberOf Sheet.JSONLoader
         */
        toTables: function() {

            var json = this.json,
                tables = $([]),
                spreadsheet,
                rows,
                row,
                columns,
                column,
                metadata,
                widths,
                width,
                frozenAt,
                height,
				table,
				colgroup,
				col,
				tr,
				td,
				i,
				j,
				k;


            for (i = 0; i < json.length; i++) {
                spreadsheet = json[i];
                table = $(document.createElement('table'));
                if (spreadsheet['title']) table.attr('title', spreadsheet['title'] || '');

                tables = tables.add(table);

                rows = spreadsheet['rows'];
                for (j = 0; j < rows.length; j++) {
                    row = rows[j];
                    if (height = (row['height'] + '').replace('px','')) {
                        tr = $(document.createElement('tr'))
                            .attr('height', height)
                            .css('height', height + 'px')
                            .appendTo(table);
                    }
                    columns = row['columns'];
                    for (k = 0; k < columns.length; k++) {
                        column = columns[k];
                        td = $(document.createElement('td'))
                            .appendTo(tr);

                        if (column['class']) td.attr('class', column['class'] || '');
                        if (column['style']) td.attr('style', column['style'] || '');
                        if (column['formula']) td.attr('data-formula', (column['formula'] ? '=' + column['formula'] : ''));
                        if (column['cellType']) td.attr('data-celltype', column['cellType'] || '');
                        if (column['value']) td.html(column['value'] || '');
                        if (column['uneditable']) td.html(column['uneditable'] || '');
                        if (column['rowspan']) td.attr('rowspan', column['rowspan'] || '');
                        if (column['colspan']) td.attr('colspan', column['colspan'] || '');
						if (column['id']) td.attr('id', column['id'] || '');
						if (column['cache']) td.html(column['cache']);
                    }
                }

                if (metadata = spreadsheet['metadata']) {
                    if (widths = metadata['widths']) {
                        colgroup = $(document.createElement('colgroup'))
                            .prependTo(table);
                        for(k = 0; k < widths.length; k++) {
                            width = (widths[k] + '').replace('px', '');
                            col = $(document.createElement('col'))
                                .attr('width', width)
                                .css('width', width + 'px')
                                .appendTo(colgroup);
                        }
                    }
                    if (frozenAt = metadata['frozenAt']) {
                        if (frozenAt['row']) {
                            table.attr('data-frozenatrow', frozenAt['row']);
                        }
                        if (frozenAt['col']) {
                            table.attr('data-frozenatcol', frozenAt['col']);
                        }
                    }
                }
            }

            return tables;
        },

        /**
         * Create json from jQuery.sheet Sheet instance
         * @param {Object} jS required, the jQuery.sheet instance
         * @param {Boolean} [doNotTrim] cut down on added json by trimming to only edited area
         * @returns {Array}  - schema:<pre>
         * [{ // sheet 1, can repeat
                 *  "title": "Title of spreadsheet",
                 *  "metadata": {
                 *      "widths": [
                 *          "120px", //widths for each column, required
                 *          "80px"
                 *      ],
                 *      "frozenAt": {row: 0, col: 0}
                 *  },
                 *  "rows": [
                 *      { // row 1, repeats for each column of the spreadsheet
                 *          "height": "18px", //optional
                 *          "columns": [
                 *              { //column A
                 *                  "cellType": "", //optional
                 *                  "class": "css classes", //optional
                 *                  "formula": "=cell formula", //optional
                 *                  "value": "value", //optional
                 *                  "style": "css cell style", //optional
                 *                  "uneditable": false,  //optional
                 *                  "cache": "",  //optional
                 *                  "id": "" //optional
                 *              },
                 *              {} //column B
                 *          ]
                 *      },
                 *      { // row 2
                 *          "height": "18px", //optional
                 *          "columns": [
                 *              { // column A
                 *                  "cellType": "", //optional
                 *                  "class": "css classes", //optional
                 *                  "formula": "=cell formula", //optional
                 *                  "value": "value", //optional
                 *                  "style": "css cell style", //optional
                 *                  "uneditable": true, //optional
                 *                  "cache": "", //optional
                 *                  "id": "" //optional
                 *              },
                 *              {} // column B
                 *          ]
                 *      }
                 *  ]
                 * }]</pre>
         * @memberOf Sheet.JSONLoader
         */
        fromSheet: function(jS, doNotTrim) {
            doNotTrim = (doNotTrim == undefined ? false : doNotTrim);

            var output = [],
                i = 1 * jS.i,
                sheet = jS.spreadsheets.length - 1,
                jsonSpreadsheet,
                spreadsheet,
                row,
                column,
                parentAttr,
                jsonRow,
                jsonColumn,
                cell,
                attr,
                cl,
                parent,
                rowHasValues,
                parentEle,
                parentHeight;

            if (sheet < 0) return output;

            do {
                rowHasValues = false;
                jS.i = sheet;
                jS.evt.cellEditDone();
                jsonSpreadsheet = {
                    "title": (jS.obj.table().attr('title') || ''),
                    "rows": [],
                    "metadata": {
                        "widths": [],
                        "frozenAt": $.extend({}, jS.obj.pane().actionUI.frozenAt)
                    }
                };

                output.unshift(jsonSpreadsheet);

                spreadsheet = jS.spreadsheets[sheet];
                row = spreadsheet.length - 1;
                do {
                    parentEle = spreadsheet[row][1].td[0].parentNode;
                    parentHeight = parentEle.style['height'];
                    jsonRow = {
                        "columns": [],
                        "height": (parentHeight ? parentHeight.replace('px', '') : jS.s.colMargin)
                    };

                    column = spreadsheet[row].length - 1;
                    do {
                        cell = spreadsheet[row][column];
                        jsonColumn = {};
                        attr = cell.td[0].attributes;

                        if (doNotTrim || rowHasValues || attr['class'] || cell['formula'] || cell['value'] || attr['style']) {
                            rowHasValues = true;

                            cl = (attr['class'] ? $.trim(
                                (attr['class'].value || '')
                                    .replace(jS.cl.uiCellActive , '')
                                    .replace(jS.cl.uiCellHighlighted, '')
                            ) : '');

                            parent = cell.td[0].parentNode;

                            jsonRow.columns.unshift(jsonColumn);

                            if (!jsonRow["height"]) {
                                jsonRow["height"] = (parent.style['height'] ? parent.style['height'].replace('px' , '') : jS.s.colMargin);
                            }

                            if (cell['formula']) jsonColumn['formula'] = cell['formula'];
                            if (cell['cellType']) jsonColumn['cellType'] = cell['cellType'];
                            if (cell['value']) jsonColumn['value'] = cell['value'];
							if (cell['uneditable']) jsonColumn['uneditable'] = cell['uneditable'];
							if (cell['cache']) jsonColumn['cache'] = cell['cache'];
							if (cell['id']) jsonColumn['id'] = cell['id'];
                            if (attr['style'] && attr['style'].value) jsonColumn['style'] = attr['style'].value;


                            if (cl.length) {
                                jsonColumn['class'] = cl;
                            }
                            if (attr['rowspan']) jsonColumn['rowspan'] = attr['rowspan'].value;
                            if (attr['colspan']) jsonColumn['colspan'] = attr['colspan'].value;

							if (row * 1 == 1) {
								jsonSpreadsheet.metadata.widths.unshift($(jS.col(null, column)).css('width').replace('px', ''));
							}
                        }
                    } while (column-- > 1);

                    if (rowHasValues) {
                        jsonSpreadsheet.rows.unshift(jsonRow);
                    }

                } while (row-- > 1);
            } while (sheet--);
            jS.i = i;

            return this.json = output;
        }
    };

    return Constructor;
})(jQuery, document);
