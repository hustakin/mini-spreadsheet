import {AfterViewInit, Component, OnInit} from '@angular/core';


export enum CellFormat {
  bold = 'bold',
  italic = 'italic',
  underline = 'underline',
}

export enum CellType {
  text = 'text',
  formula = 'formula',
}

export interface CellModel {
  type: string,
  value: any,
  eval?: any,
  formulaErr?: boolean,
  formats?: string,
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  validLabel = new RegExp(/^([A-Z]+)([0-9]+)$/);

  rows = 50;
  cols = 100;
  matrix: CellModel[][];

  focusedRow = null;
  focusedCol = null;
  tooltip: string;
  enteringFormula = false;
  formulas = {};

  constructor() {
    this.constructBlankMatrix();
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.getInputHTMLElement(0, 0).focus();
  }

  constructBlankMatrix() {
    const matrix = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        let cell: CellModel = {
          type: CellType.text,
          value: null,
          formats: '',
          formulaErr: null,
        };
        row.push(cell);
      }
      matrix.push(row);
    }
    this.matrix = matrix;
  }

  reloadMatrix() {
    const matrix = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        if (this.matrix[r] && this.matrix[r][c] && this.matrix[r][c].value) {
          let cell: CellModel = {
              type: this.matrix[r][c].type,
              value: this.matrix[r][c].value,
              formats: this.matrix[r][c].formats,
              formulaErr: this.matrix[r][c].formulaErr,
          };
          row.push(cell);
        } else {
          let cell: CellModel = {
            type: CellType.text,
            value: null,
            formats: '',
            formulaErr: null,
          };
          row.push(cell);
        }
      }
      matrix.push(row);
    }
    this.matrix = matrix;
  }


  calcFormulasInMatrix() {
    for (let r = 0; r < this.matrix.length; r++) {
      for (let c = 0; c < this.matrix[0].length; c++) {
        if (this.matrix[r][c].type == CellType.formula) {
          const val = this.evalFormula(r, c, this.matrix[r][c].value);
          if(val!==null) {
            this.matrix[r][c].eval = val;
          }
        }
      }
    }
  }

  printMatrix() {
    console.log(this.matrix);
  }

  getInputHTMLElement(row, col): HTMLInputElement {
    return document.getElementById('mini-cel:' + row + '-' + col) as HTMLInputElement;
  }

  changedAt(row, col, value) {
    this.calcFormulasInMatrix();
  }

  changingAt(row, col, value) {
    if (row === this.rows - 1) {
      this.rows += 1;
    }
    if (col === this.cols - 1) {
      this.cols += 1;
    }
    this.reloadMatrix();
  }

  evalFormula(row, col, formula: string) {
    if (formula == null || formula.length === 0 || !formula.startsWith('=')) {
      return formula;
    }
    formula = formula.trim();
    formula = formula.replace(/ /g, '');
    if (formula.length === 1) {
      return formula;
    }
    let postFormula = formula.substring(1);
    const labels = postFormula.match(/[^\+\-\*\/]+/g);
    for (const label of labels) {
      const val = this.convertLabelToValue(label);
      if(val!=null) {
        postFormula = postFormula.replace(label, val);
      }
    }
    try {
      const v = eval(postFormula);
      if(v===null) {
        this.matrix[row][col].formulaErr = true;
        return formula;
      }
      this.matrix[row][col].formulaErr = false;
      return v;
    } catch(e) {
      this.matrix[row][col].formulaErr = true;
      return formula;
    }
  }

  convertLabelToValue(label: string) {
      const isValidLabel = this.validLabel.test(label);
      const isValidNumber = !isNaN(Number(label));
      if (!isValidLabel && !isValidNumber) {
        return null;
      }
      if (isValidLabel) {
        const rc = this.validLabel.exec(label);
        // Is valid cell: col+row
        if(rc && rc.length == 3) {
          const rowIndex = Number(rc[2]) - 1;
          const colIndex = this.getColIndex(rc[1]);
          if (rowIndex < this.rows && colIndex < this.cols) {
            const cell = this.matrix[rowIndex][colIndex].value;
            if(cell === null || cell.trim() === '') {
              return 0;
            }
            else if(!isNaN(Number(cell))) {
              return cell;
            }
          } else {
            return 0;
          }
        }
        return null;
      } else {
        return label;
      }
  }

  keypress(row, col, e) {
    if(this.matrix[row][col].value === null || !this.matrix[row][col].value.startsWith('=')) {
      this.matrix[row][col].type = CellType.text;
    } else {
      this.matrix[row][col].type = CellType.formula;
    }
    if (e.keyCode === 187) {
      if (e.target.value && e.target.value.startsWith('=')) {
        this.move(row, col, 'FORMULA');
        return;
      }
    }
  }

  move(row, col, key) {
    if (key === 'UP' && row > 0) {
      this.getInputHTMLElement(row - 1, col).focus();
    } else if (key === 'LEFT' && col > 0) {
      this.getInputHTMLElement(row, col - 1).focus();
    } else if (key === 'DOWN' && row < this.rows - 1) {
      this.getInputHTMLElement(row + 1, col).focus();
    } else if (key === 'RIGHT' && col < this.cols - 1) {
      this.getInputHTMLElement(row, col + 1).focus();
    } else if (key === 'FORMULA') {
      this.enteringFormula = true;
    } else if (key === 'ENTER') {
      const isFormulaValue = this.matrix[row][col].value !== null && this.matrix[row][col].value.startsWith('=');
      if (this.enteringFormula || isFormulaValue) {
        this.calcFormulasInMatrix();
        this.focus(row, col);
      }
      this.enteringFormula = false;
    } else if (key === 'B') {
      let currentStyle = this.matrix[row][col].formats;
      const hasBold = currentStyle.indexOf(CellFormat.bold)>-1;
      if(hasBold) {
        currentStyle = currentStyle.replace(CellFormat.bold, '').trim();
      } else {
        currentStyle += ' ' + CellFormat.bold;
      }
      this.matrix[row][col].formats = currentStyle;
    } else if (key === 'I') {
      let currentStyle = this.matrix[row][col].formats;
      const hasItalic = currentStyle.indexOf(CellFormat.italic)>-1;
      if(hasItalic) {
        currentStyle = currentStyle.replace(CellFormat.italic, '').trim();
      } else {
        currentStyle += ' ' + CellFormat.italic;
      }
      this.matrix[row][col].formats = currentStyle;
    } else if (key === 'U') {
      let currentStyle = this.matrix[row][col].formats;
      const hasUnderline = currentStyle.indexOf(CellFormat.underline)>-1;
      if(hasUnderline) {
        currentStyle = currentStyle.replace(CellFormat.underline, '').trim();
      } else {
        currentStyle += ' ' + CellFormat.underline;
      }
      this.matrix[row][col].formats = currentStyle;
    }
  }

  focus(row, col) {
    this.getInputHTMLElement(row, col).select();
    this.tooltip = row + ',' + col;
    if(this.matrix[row][col].type === CellType.formula) {
      this.tooltip += ' --> ' + this.evalFormula(row, col, this.matrix[row][col].value);
    }
    this.focusedRow = row;
    this.focusedCol = col;
  }

  // index start from 0
  getColHeader(index: number) {
    if (index < 26) {
      return this.chars.charAt(index);
    }
    const base26 = index.toString(26);
    let header = '';
    for (let i = 0; i < base26.length; i++) {
      const cBase10 = parseInt(base26[i], 26);
      if (i < base26.length - 1) {
        header += this.chars.charAt(Number(cBase10) - 1);
      } else {
        header += this.chars.charAt(Number(cBase10));
      }
    }
    return header;
  }

  // returned index start from 0
  getColIndex(header: string) {
    let base10 = 0;
    let pow = 0;
    for (let i = header.length - 1; i >= 0; i--) {
      const loc = this.chars.indexOf(header[i]);
      base10 += loc * Math.pow(26, pow);
      pow++;
    }
    return base10;
  }
}
