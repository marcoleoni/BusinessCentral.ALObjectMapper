import * as vscode from 'vscode';
import { posix, resolve } from 'path';
import { setFlagsFromString } from 'v8';
import * as Excel from 'exceljs';
import { type } from 'os';

export function activate(context: vscode.ExtensionContext) {
	
	console.log('Congratulations, your extension "alobjectmapper" is now active!');
	
	let disposable = vscode.commands.registerCommand('alobjectmapper.mapobjects', () => {
		workbook = new Excel.Workbook();
  		worksheet = workbook.addWorksheet('AL Objects');
		worksheet.columns = objectsColumns;

		console.log('Check if there is almost a workspace opened');
		if (vscode.workspace.workspaceFolders == undefined)
		{
			vscode.window.showInformationMessage('No opened workspaces')
		}else{
			var name1:string = vscode.workspace.workspaceFolders![0].uri.fsPath;
			vscode.window.showInformationMessage('Mapping all AL objects in ' + name1 + ' folder');
			SearchInFiles();
		}
	});

	context.subscriptions.push(disposable);
}

class AlObjects{

	constructor(objectType: string, objectNumber: string, objectName: string)
	{
		this._objectName = objectName;
		this._objectNumber = objectNumber;
		this._objectType = objectType;
	}
	_objectType: string;
	_objectNumber: string;
	_objectName: string;

	get objectName(){return this._objectName;}
	get objectNumber(){return this._objectNumber;}
	get objectType(){return this._objectType;}
}

const objectsColumns = [
	{ key: 'objectType', header: 'Type' },
	{ key: 'objectNumber', header: 'Number' },
	{ key: 'objectName', header: 'Name' },
  ];

var workbook:Excel.Workbook;
var worksheet:Excel.Worksheet;

async function SearchInFiles()
{
	var sf = await vscode.workspace.findFiles('**/*.al');
	if (sf.length > 0)
	{
		for (let index = 0; index < sf.length; index++) {
			const element = sf[index];
			console.log('inspecting file ' + element.fsPath);
			await SearchInSourceFile(element);
		}
		console.log('writing output');
		await WriteResults();
	}
}

async function WriteResults()
{
	const wsPath = vscode.workspace.workspaceFolders![0].uri.fsPath;
	const wsedit = new vscode.WorkspaceEdit();
	const filePathToDelete = vscode.Uri.file(wsPath + '/mapping.xlsx');
	wsedit.deleteFile(filePathToDelete, { ignoreIfNotExists: true });
	await workbook.xlsx.writeFile(filePathToDelete.fsPath);
	vscode.window.showInformationMessage('Operation completed');
}

async function SearchPattern(c:vscode.TextDocument)
{
	var text = c.getText();
	const rExp : RegExp = new RegExp("(codeunit|table|enum|page|query|xmlport|report)\\s*([\\d]{5})\\s*(\".*\"|.*\\s|.*)", "igm");
	var matches  = rExp.exec(text);
	if (matches != undefined)
	{
		
		const row:AlObjects = new AlObjects(matches[1],matches[2],matches[3]);
		worksheet.addRow(row);
	}
}

async function SearchInSourceFile(f:vscode.Uri)
{
	var fileContent = await vscode.workspace.openTextDocument(f);
	await SearchPattern(fileContent);
}


// this method is called when your extension is deactivated
export function deactivate() {}
