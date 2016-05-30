use strict;
use warnings;
use utf8;
use Text::CSV;
use JSON;
use 5.12.0;
use autodie;

my $csv = Text::CSV->new({
     sep_char            => "\t"});
open my $fh, "<:encoding(utf8)", $ARGV[0];

my $headline = <$fh>;
$csv->parse($headline);
my ($ignore, @years) = $csv->fields();

while (<$fh>){
	$csv->parse($_) or die "couldn't parse :(";
	my ($id, @values) = $csv->fields();
	for my $i (0..$#years){
		say "$id,$years[$i],$values[$i]";
	}
}
