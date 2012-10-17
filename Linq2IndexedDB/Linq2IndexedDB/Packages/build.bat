if "%NuGet%"=="" SET NuGet=nuget.exe 
if "%SourcesPath%"=="" SET SourcesPath=. 

%NuGet% pack %SourcesPath%\Linq2IndexedDB\Linq2IndexedDB\Packages\IndexedbDBViewer.nuspec -version 1.0.7
%NuGet% pack %SourcesPath%\Linq2IndexedDB\Linq2IndexedDB\Packages\Linq2IndexedDB.nuspec -version 1.0.19
%NuGet% pack %SourcesPath%\Linq2IndexedDB\Linq2IndexedDB\Packages\Linq2IndexedDBWin8.nuspec -version 1.0.19
