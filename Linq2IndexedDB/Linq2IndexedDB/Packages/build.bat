IF "%NuGet%"=="" SET NuGet=nuget.exe
IF "%SourcesPath%"=="" SET SourcesPath=.

%NuGet% pack %SourcesPath%\Linq2IndexedDB\Packages\IndexedbDBViewer.nuspec
%NuGet% pack %SourcesPath%\Linq2IndexedDB\Packages\Linq2IndexedDB.nuspec
%NuGet% pack %SourcesPath%\Linq2IndexedDB\Packages\Linq2IndexedDBWin8.nuspec
