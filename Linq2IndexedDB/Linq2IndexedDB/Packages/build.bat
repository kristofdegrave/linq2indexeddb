if "%NuGet%"=="" SET NuGet=nuget.exe 
if "%SourcesPath%"=="" SET SourcesPath=. 

%NuGet% pack %SourcesPath%\Linq2IndexedDB\Packages\IndexedbDBViewer.nuspec -version 1.0.4
%NuGet% pack %SourcesPath%\Linq2IndexedDB\Packages\Linq2IndexedDB.nuspec -version 1.0.16
%NuGet% pack %SourcesPath%\Linq2IndexedDB\Packages\Linq2IndexedDBWin8.nuspec -version 1.0.16
