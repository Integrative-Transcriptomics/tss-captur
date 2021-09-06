echo "Directory for nt database:"
read dbdirectory

./nextflow run tss_captur.nf --inputTable input/CampySubset/MasterTableSubset.tsv --inputGenomes input/CampySubset/fasta/ --inputGFFs input/CampySubset/gff/ --outputDir output/InterfaceTesting/ --blastdb $dbdirectory  -with-docker mwittep/tsscaptur  -resume
