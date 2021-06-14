import {Component, forwardRef, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from '@angular/forms';
import {NestedTreeControl} from '@angular/cdk/tree';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {SelectionModel} from '@angular/cdk/collections';
import {map, startWith, tap} from 'rxjs/operators';

interface SimpleTreeNode {
  name: string;
  children?: this[];
}

@Component({
  selector: 'app-tree-autocomplete-control',
  templateUrl: './tree-autocomplete-control.component.html',
  styleUrls: ['./tree-autocomplete-control.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => TreeAutocompleteControlComponent),
    multi: true
  }]
})
export class TreeAutocompleteControlComponent<T extends SimpleTreeNode> implements OnChanges, OnInit, ControlValueAccessor {
  @Input() disabled = false;
  @Input() label = '';
  @Input() treeData: T[] = [];

  autoInput: FormControl;
  treeControl: NestedTreeControl<T>;
  dataSource: MatTreeNestedDataSource<T>;
  selection: SelectionModel<string>;

  constructor() {
    this.treeData = [];
    this.autoInput = new FormControl();
    this.treeControl = new NestedTreeControl<T>(node => node.children);
    this.dataSource = new MatTreeNestedDataSource<T>();
    this.selection = new SelectionModel<string>(false);
    this.writeValue(null);
  }

  private _value!: T | null;
  get value(): T | null {
    return this._value;
  }
  @Input()
  set value(value: T | null) {
    this._value = value;
  }

  hasChild = (_: number, node: T) => this._hasChild(node);

  onChange = (_: any) => {};

  onTouched = () => {};

  ngOnChanges(changes: SimpleChanges): void {
    // Listen to when data from parent is available
    this.dataSource.data = this.treeData;
  }

  ngOnInit(): void {
    this.autoInput.valueChanges
      .pipe(
        startWith(''),
        map(value => value === null ? '' : typeof value === 'string' ? value : value.name),
        tap(searchTerm => {
          if (searchTerm) {
            this.dataSource.data = this._filter(searchTerm, this.dataSource.data);
          } else {
            this.dataSource.data = this.treeData;
          }
        }),
      ).subscribe();
    this.writeValue(this.value);
  }

  getDisplayFile(node: T): string {
    return node && node.name ? node.name : '';
  }

  writeValue(node: T | null): void {
    if (node !== null) {
      this.value = node;
      this.autoInput.patchValue(this.value);
      this.selection.select(this.value.name);
      this.onChange(this.value);
    } else {
      this._clearValue();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  selectOption(node: T): void {
    this.writeValue(node);
    this.dataSource.data = this.treeData;
  }

  reselectOption(): void {
    this.autoInput.patchValue(this.value);
  }

  deselectOption(): void {
    this._clearValue();
    this.dataSource.data = this.treeData;
  }

  private _hasChild(node: T): boolean {
    return node.children !== undefined && !!node.children.length;
  }

  private _filter(searchTerm: string, nodes: T[]): T[] {
    return nodes.map(node => {
      if (this._found(searchTerm, node.name)) {
        return {name: node.name, children: node.children} as T;
      } else if (this._hasChild(node)) {
        const filteredChildren = this._filter(searchTerm, node.children!);
        if (filteredChildren.length) {
          return {
            name: node.name,
            children: filteredChildren
          } as T;
        }
      }
      return {name: ''} as T;
    }).filter(value => !!value.name);
  }

  private _found(searchTerm: string, value: string): boolean {
    return value.toLowerCase().includes(searchTerm.toLowerCase());
  }

  private _clearValue(): void {
    this.value = null;
    this.autoInput.patchValue(null);
    this.selection.clear();
    this.onChange(this.value);
  }
}
