#!/usr/bin/perl

use strict;
use warnings;
use feature 'switch';
use Getopt::Long;

my $compress = 1;
my ( @flags, %hashFlags, $outFile );

GetOptions(
	'compress!'	=> \$compress,
	'flag=s'	=> \@flags,
	'out=s'		=> \$outFile,
);
@flags = split ( ',', join(',', @flags) );
@hashFlags{@flags} = ();
die 'Please specify input file' unless $ARGV[0];
my $inFile = $ARGV[0];

my ( $file, $content, @condStack );
open ( $file, $inFile ) or die "Could not open $inFile for read: $!";
sub findFlag ($) {
	return 1 unless %hashFlags;
	my @flags = split ( ',', $_[0] );
	foreach (@flags) {
		return 0 if ( ( substr($_, 0, 1) ne '!' && exists $hashFlags{$_} ) 
			|| ( substr($_, 0, 1) eq '!' && !exists $hashFlags{substr($_, 1)} ) );
	}
	return 1;
}
while ( <$file> ) {
	if ( m{^\s*//\s*#if\s+(.*)$} ) {
		push @condStack, findFlag($1);
	} elsif ( m{^\s*//\s*#elseif\s+(.*)$} ) {
		given ($condStack[-1]) {
			$condStack[-1] = 2 when 0;
			$condStack[-1] = findFlag($1) when 1;
			die "ERROR: unpaired #elseif in line $." when undef;
		}
	} elsif ( m{^\s*//\s*#else\s*$} ) {
		given ($condStack[-1]) {
			$condStack[-1] = 2 when 0;
			$condStack[-1] = 0 when 1;
			die "ERROR: unpaired #else in line $." when undef;
		}
	} elsif ( m{^\s*//\s*#endif\s*$} ) {
		defined pop @condStack or die "ERROR: unpaired #endif in line $.";
	} elsif ( !grep { $_ } @condStack ) {
		s{
			\${(\w+)}
		}{
			no strict 'refs';
			exists $ENV{$1} ? $ENV{$1} : "\${$1}";
		}egx;
		$content .= $_;
	}
}
close $file;
die "ERROR: unpaired #if" if @condStack;

if ( $compress ) {
	if ( substr($inFile, -4) eq '.css' ) {
		for ( $content ) {
			s/\n//g;
			s/\s*([{},+~>:;])\s*/$1/g;
			s/;}/}/g;
		}
	} elsif ( substr($inFile, -5) eq '.html' ) {
		for ( $content ) {
			s/\n//g;
		}
	} elsif ( substr($inFile, -3) eq '.js' ) {
		unless ( -e 'compiler.jar' ) {
			system('wget -q http://closure-compiler.googlecode.com/files/compiler-latest.tar.gz') == 0
				or die 'Failed to download Google Closure Compiler';
			system 'tar -xzf compiler-latest.tar.gz compiler.jar';
			unlink 'compiler-latest.tar.gz';
		}
		open ( $file, '>', 'body.js' ) and print $file $content and close $file;
		$content = `java -jar compiler.jar --charset=UTF-8 --compilation_level SIMPLE_OPTIMIZATIONS --js=body.js`;
		unlink 'body.js';
		die 'Error during compression' unless $content;
	}
}

open ( $file, '>'.($outFile || '-') ) or die "Could not write to output file $outFile: $!";
print $file $content and close $file;